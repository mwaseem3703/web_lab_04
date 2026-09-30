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

// Mock Databases (Expanded 10-15 items)
let orders = [
  { id: 1, item: "Laptop Pro 15", status: "Processing" },
  { id: 2, item: "Wireless Mouse", status: "Shipped" },
  { id: 3, item: "Mechanical Keyboard", status: "Delivered" },
  { id: 4, item: "USB-C Hub", status: "Processing" },
  { id: 5, item: "4K Ultra HD Monitor", status: "Shipped" },
  { id: 6, item: "Noise Cancelling Headphones", status: "Processing" },
  { id: 7, item: "Ergonomic Office Chair", status: "Delivered" },
  { id: 8, item: "1080p HD Webcam", status: "Cancelled" },
  { id: 9, item: "Leather Desk Mat", status: "Processing" },
  { id: 10, item: "Motorized Standing Desk", status: "Shipped" },
  { id: 11, item: "Portable Bluetooth Speaker", status: "Processing" },
  { id: 12, item: "1TB External NVMe SSD", status: "Delivered" },
  { id: 13, item: "Dual Monitor Arm", status: "Processing" }
];

let catalog = [
  { id: 101, sku: "TECH-001", name: "Laptop Pro 15", price: 1299.99, stock: 45 },
  { id: 102, sku: "TECH-002", name: "Wireless Mouse", price: 29.99, stock: 120 },
  { id: 103, sku: "TECH-003", name: "Mechanical Keyboard", price: 89.99, stock: 85 },
  { id: 104, sku: "TECH-004", name: "USB-C Hub", price: 45.00, stock: 200 },
  { id: 105, sku: "TECH-005", name: "4K Ultra HD Monitor", price: 399.99, stock: 30 },
  { id: 106, sku: "TECH-006", name: "Noise Cancelling Headphones", price: 199.99, stock: 60 },
  { id: 107, sku: "TECH-007", name: "Ergonomic Office Chair", price: 249.99, stock: 15 },
  { id: 108, sku: "TECH-008", name: "1080p HD Webcam", price: 59.99, stock: 90 },
  { id: 109, sku: "TECH-009", name: "Leather Desk Mat", price: 19.99, stock: 300 },
  { id: 110, sku: "TECH-010", name: "Motorized Standing Desk", price: 499.99, stock: 10 },
  { id: 111, sku: "TECH-011", name: "Portable Bluetooth Speaker", price: 79.99, stock: 150 },
  { id: 112, sku: "TECH-012", name: "1TB External NVMe SSD", price: 109.99, stock: 110 },
  { id: 113, sku: "TECH-013", name: "Dual Monitor Arm", price: 65.00, stock: 40 }
];

// ==========================================
// 1. REST API (Resource Management)
// ==========================================
app.get("/api/v1/orders", (req, res) => {
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

app.get("/api/v1/catalog", (req, res) => {
  res.status(200).json({ success: true, count: catalog.length, data: catalog });
});

// Mock GraphQL Endpoint (To support your frontend's advanced tab)
app.post("/graphql", (req, res) => {
  res.json({
    data: { orders, catalog }
  });
});

// ==========================================
// 2. Server-Sent Events (SSE) (Live Alerts)
// ==========================================
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const alerts = [
    { message: "System healthy. All systems operational.", severity: "success" },
    { message: "New inventory arrived at Warehouse B.", severity: "info" },
    { message: "High latency detected on checkout service.", severity: "warning" },
    { message: "Scheduled maintenance in 30 minutes.", severity: "info" }
  ];
  let alertIndex = 0;

  const interval = setInterval(() => {
    const alertMsg = JSON.stringify(alerts[alertIndex % alerts.length]);
    res.write(`data: ${alertMsg}\n\n`);
    alertIndex++;
  }, 10000);

  req.on("close", () => clearInterval(interval));
});

// ==========================================
// 3. JSON-RPC 2.0 (Action Methods)
// ==========================================
app.post("/rpc", (req, res) => {
  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== "2.0") {
    return res.status(400).json({ error: "Invalid JSON-RPC protocol" });
  }

  // Action: cancelOrder
  if (method === "cancelOrder") {
    const orderIndex = orders.findIndex((o) => o.id === params.orderId);
    if (orderIndex === -1) {
      return res.json({ jsonrpc: "2.0", error: { code: -32602, message: "Order not found" }, id });
    }
    orders[orderIndex].status = "Cancelled";
    
    // Broadcast status change to clients via WebSocket
    io.emit("orderStatusUpdate", { id: params.orderId, status: "Cancelled" });
    
    return res.json({ jsonrpc: "2.0", result: `Order ${params.orderId} cancelled successfully`, id });
  }

  // Action: getOrder
  if (method === "getOrder") {
    const order = orders.find((o) => o.id === params.orderId);
    if (!order) {
      return res.json({ jsonrpc: "2.0", error: { code: -32602, message: "Order not found" }, id });
    }
    return res.json({ jsonrpc: "2.0", result: order, id });
  }

  // Action: updateStatus
  if (method === "updateStatus") {
    const order = orders.find((o) => o.id === params.orderId);
    if (!order) {
      return res.json({ jsonrpc: "2.0", error: { code: -32602, message: "Order not found" }, id });
    }
    order.status = params.status;
    
    // Broadcast status change to clients via WebSocket
    io.emit("orderStatusUpdate", { id: params.orderId, status: order.status });
    
    return res.json({ jsonrpc: "2.0", result: `Order ${params.orderId} status updated to ${params.status}`, id });
  }

  // Method not found fallback
  return res.json({ jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id });
});

// ==========================================
// 4. WebSockets (Live Chat Support)
// ==========================================
let onlineUsers = 0;

io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("onlineUsers", onlineUsers); // Push updated count to frontend

  // Private Room Logic
  socket.on("joinRoom", (data) => {
    if (data.room) {
      socket.join(data.room);
      socket.to(data.room).emit("roomNotice", { 
        room: data.room, 
        text: `${data.name || 'Someone'} joined as ${data.role === 'agent' ? 'an agent' : 'a customer'}` 
      });
    }
  });

  socket.on("leaveRoom", (data) => {
    if (data.room) {
      socket.leave(data.room);
      socket.to(data.room).emit("roomNotice", { room: data.room, text: `A user has left the room.` });
    }
  });

  // Message Broadcasting (Handles both Public and Private Rooms)
  socket.on("sendMessage", (message) => {
    if (message.scope === "room" && message.room) {
      io.to(message.room).emit("newMessage", message); // Private
    } else {
      io.emit("newMessage", message); // Public
    }
  });

  // Live Typing Indicators
  socket.on("typing", (data) => {
    if (data.scope === "room" && data.room) {
      socket.to(data.room).emit("typing", data); // Private
    } else {
      socket.broadcast.emit("typing", data); // Public
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit("onlineUsers", onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});