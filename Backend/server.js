const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Initialize WebSockets (Socket.io)
const io = new Server(server, {
  cors: { origin: "*" },
});

// Mock Database
let orders = [
  { id: 1, item: "Laptop", status: "Processing" },
  { id: 2, item: "Wireless Mouse", status: "Shipped" },
];

// ==========================================
// 1. REST API (Resource Management)
// ==========================================
app.get("/api/v1/orders", (req, res) => {
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// ==========================================
// 2. Server-Sent Events (SSE) (Live Alerts)
// ==========================================
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Push an alert every 10 seconds
  const interval = setInterval(() => {
    const alertMsg = JSON.stringify({
      message: "System healthy. All systems operational.",
    });
    res.write(`data: ${alertMsg}\n\n`);
  }, 10000);

  req.on("close", () => clearInterval(interval));
});

// ==========================================
// 3. JSON-RPC 2.0 (Action Methods)
// ==========================================
app.post("/rpc", (req, res) => {
  const { jsonrpc, method, params, id } = req.body;

  // Validate protocol
  if (jsonrpc !== "2.0") {
    return res.status(400).json({ error: "Invalid JSON-RPC protocol" });
  }

  // Handle specific action
  if (method === "cancelOrder") {
    const orderIndex = orders.findIndex((o) => o.id === params.orderId);
    if (orderIndex === -1) {
      return res.json({
        jsonrpc: "2.0",
        error: { code: -32602, message: "Order not found" },
        id,
      });
    }

    orders[orderIndex].status = "Cancelled";
    return res.json({
      jsonrpc: "2.0",
      result: `Order ${params.orderId} cancelled successfully`,
      id,
    });
  }

  // Method not found fallback
  return res.json({
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id,
  });
});

// ==========================================
// 4. WebSockets (Live Chat Support)
// ==========================================
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.join("support-room");

  socket.on("sendMessage", (message) => {
    // Broadcast the message to everyone in the support room
    io.to("support-room").emit("newMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
