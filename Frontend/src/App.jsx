import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  Headset,
  Info,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Package,
  Play,
  Plug,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Siren,
  Smile,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

/* ───────────────────────── CONFIG ───────────────────────── */
const API = "http://localhost:5000";
const socket = io(API);

const NAV = [
  {
    id: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    tag: "All services",
    grad: "from-indigo-500 to-violet-500",
  },
  {
    id: "resources",
    label: "Orders & Catalog",
    icon: ShoppingBag,
    tag: "REST · GraphQL",
    grad: "from-fuchsia-500 to-orange-400",
  },
  {
    id: "chat",
    label: "Live Chat",
    icon: MessageCircle,
    tag: "Public + private rooms",
    grad: "from-cyan-500 to-blue-500",
  },
  {
    id: "rpc",
    label: "Action Console",
    icon: Terminal,
    tag: "JSON-RPC 2.0",
    grad: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "alerts",
    label: "System Alerts",
    icon: Radio,
    tag: "Server-Sent Events",
    grad: "from-emerald-500 to-teal-500",
  },
];
const SHORT = {
  dashboard: "Home",
  resources: "Orders",
  chat: "Chat",
  rpc: "Console",
  alerts: "Alerts",
};
const TONE = {
  Shipped: "green",
  Processing: "amber",
  Delivered: "sky",
  Cancelled: "rose",
};
const SEV = {
  info: { icon: Info, tone: "sky" },
  success: { icon: CheckCircle2, tone: "green" },
  warning: { icon: AlertTriangle, tone: "amber" },
  critical: { icon: Siren, tone: "rose" },
};
const EMOJI = ["👍", "😊", "🎉", "🙏", "📦", "✅"];

const clientId = Math.random().toString(36).slice(2, 8);
const time = (d = new Date()) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const hue = (s = "?") =>
  [...s].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360;

/* ───────────────────────── STYLES + THEME TOKENS ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');
html,body,#root{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;min-width:0!important;height:100%;display:block!important;text-align:left!important}
.hub{position:fixed;inset:0;display:flex;overflow:hidden;overflow:clip;overscroll-behavior:none;font-family:'Manrope',system-ui,sans-serif;font-size:14px;background:var(--bg);color:var(--text);text-align:left}
.hub *{box-sizing:border-box}
.hub h1,.hub h2,.hub .disp{font-family:'Outfit','Manrope',sans-serif}
.hub[data-theme=light]{--bg:#f6f5ff;--side:rgba(255,255,255,.8);--card:rgba(255,255,255,.94);--solid:#ffffff;--ring:rgba(91,33,182,.11);--text:#1b1740;--sub:#403d69;--mute:#7673a3;--input:#fbfaff;--hover:rgba(124,58,237,.07);--bub:#efeaff;--dots:rgba(124,58,237,.10);--shadow:0 1px 2px rgba(91,33,182,.06),0 16px 34px -20px rgba(91,33,182,.30);
 --green:#047857;--amber:#b45309;--sky:#0369a1;--rose:#be123c;--violet:#6d28d9}
.hub[data-theme=dark]{--bg:#0b0921;--side:rgba(8,6,28,.72);--card:rgba(255,255,255,.055);--solid:#1c1842;--ring:rgba(255,255,255,.10);--text:#f4f3ff;--sub:#cfcdea;--mute:#928fb8;--input:rgba(255,255,255,.06);--hover:rgba(255,255,255,.07);--bub:rgba(255,255,255,.10);--dots:rgba(255,255,255,.06);--shadow:0 20px 40px -20px rgba(0,0,0,.6);
 --green:#4ade80;--amber:#fbbf24;--sky:#38bdf8;--rose:#fb7185;--violet:#c4b5fd}
.card{background:var(--card);box-shadow:0 0 0 1px var(--ring),var(--shadow);backdrop-filter:blur(18px)}
.t-main{color:var(--text)}.t-sub{color:var(--sub)}.t-mute{color:var(--mute)}
.divide{border-color:var(--ring)}
.inp{background:var(--input);color:var(--text);box-shadow:inset 0 0 0 1px var(--ring);border:0;font:inherit}
.inp::placeholder{color:var(--mute)}
.inp:focus{outline:none;box-shadow:inset 0 0 0 1.5px #8b5cf6,0 0 0 4px rgba(139,92,246,.15)}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 12px;border-radius:10px;border:0;font:700 12.5px/1 'Manrope',sans-serif;cursor:pointer;white-space:nowrap;transition:transform .15s,filter .15s,background .15s}
.btn:hover:not(:disabled){transform:translateY(-1px)}
.btn:active:not(:disabled){transform:scale(.97)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn:focus-visible,.seg-btn:focus-visible,.chip:focus-visible,.nav-item:focus-visible,.icon-btn:focus-visible{outline:2px solid #8b5cf6;outline-offset:2px}
.btn-md{height:38px;padding:0 16px;font-size:13px;border-radius:12px}
.btn-block{width:100%}
.btn-primary{background:linear-gradient(135deg,#7c3aed,#d946ef 60%,#fb923c);color:#fff;box-shadow:0 8px 16px -8px rgba(192,38,211,.75)}
.btn-primary:hover:not(:disabled){filter:brightness(1.08)}
.btn-soft{background:color-mix(in srgb,#7c3aed 11%,transparent);color:var(--violet)}
.btn-soft:hover:not(:disabled){background:color-mix(in srgb,#7c3aed 19%,transparent)}
.btn-outline{background:var(--solid);color:var(--sub);box-shadow:inset 0 0 0 1px var(--ring)}
.btn-outline:hover:not(:disabled){background:var(--hover)}
.btn-danger{--t:var(--rose);color:var(--t);background:color-mix(in srgb,var(--t) 11%,transparent)}
.btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--t) 20%,transparent)}
.btn-glass{background:rgba(255,255,255,.22);color:#fff;backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.32)}
.btn-glass:hover:not(:disabled){background:rgba(255,255,255,.34)}
.btn-white{background:#fff;color:#6d28d9;box-shadow:0 8px 16px -10px rgba(0,0,0,.5)}
.icon-btn{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;border:0;cursor:pointer;background:var(--solid);color:var(--sub);box-shadow:inset 0 0 0 1px var(--ring);transition:background .15s,transform .15s;position:relative}
.icon-btn:hover{background:var(--hover);transform:translateY(-1px)}

/* segmented + chips */
.seg{display:inline-flex;gap:2px;padding:3px;border-radius:12px;background:var(--hover)}
.seg-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:9px;border:0;background:transparent;color:var(--mute);font:700 12.5px 'Manrope',sans-serif;cursor:pointer;transition:.15s}
.seg-btn:hover{color:var(--text)}
.seg-btn.on{background:var(--solid);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px var(--ring)}
.seg-glass{background:rgba(255,255,255,.22)}
.seg-glass .seg-btn{color:#fff}.seg-glass .seg-btn.on{background:#fff;color:#7c3aed}
.chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:9999px;border:0;background:var(--solid);color:var(--sub);box-shadow:inset 0 0 0 1px var(--ring);font:700 12px 'Manrope',sans-serif;cursor:pointer;transition:.15s;text-transform:capitalize}
.chip:hover{background:var(--hover)}
.chip.on{background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;box-shadow:0 8px 16px -10px #c026d3}
.nav-item{display:flex;width:100%;align-items:center;gap:12px;padding:8px 10px;border-radius:14px;border:0;background:transparent;text-align:left;cursor:pointer;transition:background .15s;color:inherit;font:inherit}
.nav-item:hover{background:var(--hover)}
.nav-on{background:linear-gradient(90deg,color-mix(in srgb,#a855f7 16%,transparent),color-mix(in srgb,#ec4899 8%,transparent));box-shadow:inset 0 0 0 1px var(--ring)}
.svc{display:flex;width:100%;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:14px;border:0;cursor:pointer;text-align:left;font:inherit;color:inherit;background:var(--input);box-shadow:inset 0 0 0 1px var(--ring);transition:background .15s}
.svc:hover{background:var(--hover)}
.pill{display:grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:9999px;background:#f43f5e;color:#fff;font-size:11px;font-weight:800}

/* tones */
.tone{color:var(--t);background:color-mix(in srgb,var(--t) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--t) 26%,transparent)}
.tone-green{--t:var(--green)}.tone-amber{--t:var(--amber)}.tone-sky{--t:var(--sky)}.tone-rose{--t:var(--rose)}.tone-violet{--t:var(--violet)}
.code{background:#14112e;color:#d1fae5}

/* chat */
.chat-bg{background-image:radial-gradient(circle at 1px 1px,var(--dots) 1px,transparent 0);background-size:20px 20px}
.bubble-me{background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;box-shadow:0 10px 20px -12px #c026d3}
.bub{background:var(--bub);color:var(--text)}

/* scrolling */
.scroll{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,#8b5cf6 38%,transparent) transparent;overscroll-behavior:contain;scroll-behavior:smooth}
.scroll::-webkit-scrollbar{width:9px;height:9px}
.scroll::-webkit-scrollbar-track{background:transparent}
.scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,#8b5cf6 38%,transparent);border-radius:9999px;border:2px solid transparent;background-clip:padding-box}
.scroll::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,#8b5cf6 60%,transparent);background-clip:padding-box}
.sticky-th th{position:sticky;top:0;z-index:1;background:var(--solid)}

/* responsive shell */
.side{display:none}
.mnav{display:none}
.only-m{display:flex}
.only-d{display:none}
@media (min-width:768px){.side{display:block}.only-m{display:none}.only-d{display:block}}
@media (max-width:767px){.mnav{display:flex}.content{padding-bottom:104px!important}}
.mnav{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:35;gap:2px;padding:6px;border-radius:24px;background:var(--card);backdrop-filter:blur(20px);box-shadow:0 0 0 1px var(--ring),0 18px 40px -14px rgba(91,33,182,.45)}
.mnav-item{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;border:0;background:transparent;border-radius:18px;color:var(--mute);font:700 10.5px 'Manrope',sans-serif;cursor:pointer;transition:.15s}
.mnav-item .mi{display:grid;place-items:center;width:38px;height:28px;border-radius:12px;transition:.15s}
.mnav-item.on{color:var(--text)}
.mnav-item.on .mi{background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;box-shadow:0 8px 14px -8px #c026d3}
.mnav-item .pill{position:absolute;top:0;right:10px;min-width:16px;height:16px;font-size:10px;padding:0 4px}

/* loading */
.sk{background:linear-gradient(90deg,var(--hover),var(--ring),var(--hover));background-size:200% 100%;animation:sh 1.3s linear infinite;border-radius:10px}
.blob{position:absolute;border-radius:9999px;filter:blur(100px);opacity:.5;animation:float 14s ease-in-out infinite;pointer-events:none}
.hub[data-theme=light] .blob{opacity:.32}
.topbar{position:fixed;top:0;left:0;height:3px;width:40%;background:linear-gradient(90deg,#a855f7,#ec4899,#fb923c);border-radius:0 3px 3px 0;animation:bar 1.1s ease-in-out infinite;z-index:90}
.ring-spin{animation:spin 1.4s linear infinite}
.splash{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:var(--bg);transition:opacity .5s,transform .5s}
.splash.out{opacity:0;transform:scale(1.03);pointer-events:none}
.pulse-ring{animation:pr 2s ease-out infinite}
.page{animation:pop .35s ease-out}
@keyframes sh{to{background-position:-200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes bar{0%{left:-40%}100%{left:100%}}
@keyframes pr{0%{transform:scale(.8);opacity:.7}100%{transform:scale(1.9);opacity:0}}
@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.hub *{animation:none!important;transition:none!important}}
`;

/* ───────────────────────── SMALL UI PARTS ───────────────────────── */
const Card = ({ className = "", style, children }) => (
  <div style={style} className={`card rounded-3xl ${className}`}>
    {children}
  </div>
);
const Btn = ({ v = "soft", s = "sm", className = "", ...p }) => (
  <button
    {...p}
    className={`btn btn-${v} ${s === "md" ? "btn-md" : ""} ${className}`}
  />
);
const Spinner = ({ size = 14 }) => (
  <span
    className="ring-spin inline-block rounded-full border-2 border-current border-t-transparent"
    style={{ width: size, height: size }}
  />
);

const Badge = ({ status }) => (
  <span
    className={`tone tone-${TONE[status] || "violet"} inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

const Avatar = ({ name = "?", size = 32 }) => {
  const h = hue(name);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-extrabold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg,hsl(${h} 75% 55%),hsl(${(h + 45) % 360} 75% 45%))`,
      }}
    >
      {name.trim()[0]?.toUpperCase() || "?"}
    </span>
  );
};

function Hero({ title, protocol, desc, icon: Icon, grad, children }) {
  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-r ${grad} p-6 shadow-xl md:px-8 md:py-7`}
    >
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15" />
      <div className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-white/10" />
      <Icon
        className="absolute bottom-3 right-8 hidden h-24 w-24 text-white/20 md:block"
        strokeWidth={1.2}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            <Sparkles size={11} /> {protocol}
          </span>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-white md:text-[34px]">
            {title}
          </h1>
          <p className="m-0 mt-1.5 max-w-xl text-[13px] font-medium text-white/85">
            {desc}
          </p>
        </div>
        {children && (
          <div className="relative flex flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

const Empty = ({ icon: Icon, title, hint, children }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <div className="tone tone-violet rounded-2xl p-3.5">
      <Icon size={24} />
    </div>
    <p className="t-main m-0 font-bold">{title}</p>
    <p className="t-mute m-0 max-w-xs text-[13px]">{hint}</p>
    {children && (
      <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>
    )}
  </div>
);

function useCountUp(target) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const from = v;
    const step = (t) => {
      start ??= t;
      const p = Math.min((t - start) / 700, 1);
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [target]);
  return v;
}

const Stat = ({ label, value, icon: Icon, grad }) => {
  const n = useCountUp(value);
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${grad} p-5 shadow-lg`}
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
      <Icon className="absolute -bottom-3 -right-3 h-20 w-20 text-white/20" />
      <p className="m-0 text-[13px] font-semibold text-white/85">{label}</p>
      <p className="disp m-0 mt-1.5 text-5xl font-extrabold text-white">{n}</p>
    </div>
  );
};

/* ───────────────────────── SPLASH / LOADING SCREEN ───────────────────────── */
function Splash({ out, steps }) {
  const done = steps.filter((s) => s[1]).length;
  return (
    <div className={`splash ${out ? "out" : ""}`}>
      <div className="blob -left-20 -top-20 h-96 w-96 bg-fuchsia-400" />
      <div
        className="blob -bottom-20 right-0 h-96 w-96 bg-cyan-300"
        style={{ animationDelay: "-6s" }}
      />
      <div className="relative flex w-80 flex-col items-center text-center">
        <div className="relative mb-7 grid h-28 w-28 place-items-center">
          <span className="pulse-ring absolute inset-0 rounded-full bg-fuchsia-500/30" />
          <span
            className="pulse-ring absolute inset-0 rounded-full bg-violet-500/30"
            style={{ animationDelay: "1s" }}
          />
          <span
            className="ring-spin absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg,#a855f7,#ec4899,#fb923c,transparent 70%)",
              WebkitMask:
                "radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px))",
              mask: "radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px))",
            }}
          />
          <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-fuchsia-500/40">
            <Package size={38} />
          </div>
        </div>
        <h2 className="t-main m-0 text-3xl font-extrabold">SystemHub</h2>
        <p className="t-mute mb-5 mt-1 text-sm">Connecting your order desk</p>
        <div
          className="mb-4 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--ring)" }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 transition-all duration-500"
            style={{ width: `${Math.max(12, (done / steps.length) * 100)}%` }}
          />
        </div>
        <ul className="m-0 w-full list-none space-y-2 p-0">
          {steps.map(([label, ok]) => (
            <li
              key={label}
              className="card flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm"
            >
              <span className="t-sub font-semibold">{label}</span>
              {ok ? (
                <span className="tone tone-green grid h-5 w-5 place-items-center rounded-full">
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : (
                <span className="t-mute">
                  <Spinner size={15} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SkeletonRows = ({ n = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <div className="sk h-10 w-16" />
        <div className="sk h-10 flex-1" />
        <div className="sk h-10 w-24" />
        <div className="sk h-10 w-20" />
      </div>
    ))}
  </div>
);

/* ───────────────────────── PAGE: OVERVIEW ───────────────────────── */
function Dashboard({ orders, catalog, alerts, connected, sseUp, go, loading }) {
  const active = orders.filter((o) => o.status !== "Cancelled").length;
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const stats = [
    {
      label: "Total orders",
      value: orders.length,
      icon: ShoppingBag,
      grad: "from-violet-600 to-fuchsia-500",
    },
    {
      label: "Active orders",
      value: active,
      icon: Package,
      grad: "from-orange-400 to-rose-500",
    },
    {
      label: "Catalog items",
      value: catalog.length,
      icon: Boxes,
      grad: "from-cyan-500 to-blue-600",
    },
    {
      label: "Alerts received",
      value: alerts.length,
      icon: Radio,
      grad: "from-emerald-500 to-teal-600",
    },
  ];
  const services = [
    {
      id: "resources",
      name: "REST / GraphQL",
      up: true,
      note: "Orders and catalog",
    },
    {
      id: "chat",
      name: "WebSocket chat",
      up: connected,
      note: connected ? "Connected" : "Disconnected",
    },
    { id: "rpc", name: "JSON-RPC actions", up: true, note: "POST /rpc" },
    {
      id: "alerts",
      name: "Alert stream",
      up: sseUp,
      note: sseUp ? "Streaming" : "Offline",
    },
  ];
  const byStatus = ["Processing", "Shipped", "Delivered", "Cancelled"].map(
    (s) => ({ s, n: orders.filter((o) => o.status === s).length }),
  );
  const max = Math.max(1, ...byStatus.map((b) => b.n));

  return (
    <>
      <Hero
        title={`${greet}, Admin`}
        protocol="Operations overview"
        desc="Everything happening across orders, chat, actions and alerts in one place."
        icon={LayoutDashboard}
        grad="from-indigo-600 via-violet-600 to-fuchsia-500"
      >
        <Btn v="white" s="md" onClick={() => go("resources")}>
          <ShoppingBag size={15} /> View orders
        </Btn>
        <Btn v="glass" s="md" onClick={() => go("chat")}>
          <MessageCircle size={15} /> Open chat
        </Btn>
      </Hero>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sk h-32 !rounded-3xl" />
            ))
          : stats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="t-main m-0 mb-4 text-base font-bold">
            Service health
          </h3>
          <div className="space-y-2.5">
            {services.map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className="svc">
                <span>
                  <span className="t-main block text-sm font-bold">
                    {l.name}
                  </span>
                  <span className="t-mute block text-xs">{l.note}</span>
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${l.up ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-rose-500"}`}
                />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="t-main m-0 mb-5 text-base font-bold">
            Orders by status
          </h3>
          <div className="space-y-4">
            {byStatus.map(({ s, n }) => (
              <div key={s}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="t-sub font-semibold">{s}</span>
                  <span className="t-main font-bold">{n}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--hover)" }}
                >
                  <div
                    className={`tone-${TONE[s]} h-full rounded-full transition-all duration-700`}
                    style={{
                      width: `${(n / max) * 100}%`,
                      background: "var(--t)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="t-main m-0 text-base font-bold">Latest alerts</h3>
            <Btn v="soft" onClick={() => go("alerts")}>
              View all
            </Btn>
          </div>
          {alerts.length === 0 ? (
            <Empty
              icon={Radio}
              title="No alerts yet"
              hint="Alerts sent by the server appear here instantly."
            />
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {alerts.slice(0, 4).map((a) => {
                const S = SEV[a.severity] || SEV.info;
                return (
                  <li
                    key={a.id}
                    className={`tone tone-${S.tone} flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px]`}
                  >
                    <S.icon size={16} />
                    <span className="t-main flex-1 font-medium">
                      {a.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────── PAGE: RESOURCES (REST / GraphQL) ───────────────────────── */
function Resources({
  orders,
  catalog,
  source,
  setSource,
  reload,
  loading,
  onCancel,
}) {
  const [tab, setTab] = useState("orders");
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      (tab === "orders" ? orders : catalog).filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q.toLowerCase()),
      ),
    [tab, orders, catalog, q],
  );
  const th = "t-mute py-2.5 text-xs font-bold";

  return (
    <>
      <Hero
        title="Orders & Catalog"
        icon={ShoppingBag}
        grad="from-fuchsia-500 via-pink-500 to-orange-400"
        protocol={
          source === "rest"
            ? "REST · GET /api/v1/orders"
            : "GraphQL · POST /graphql"
        }
        desc="Browse your resources through whichever API style the backend exposes."
      >
        <div className="seg seg-glass">
          {["rest", "graphql"].map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`seg-btn ${source === s ? "on" : ""}`}
            >
              {s === "rest" ? "REST" : "GraphQL"}
            </button>
          ))}
        </div>
        <Btn v="glass" onClick={reload}>
          <RefreshCw size={14} className={loading ? "ring-spin" : ""} /> Refresh
        </Btn>
      </Hero>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="seg">
            {[
              ["orders", "Orders", ShoppingBag, orders.length],
              ["catalog", "Catalog", Boxes, catalog.length],
            ].map(([id, label, Ic, n]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`seg-btn ${tab === id ? "on" : ""}`}
              >
                <Ic size={14} />
                {label}
                <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              className="t-mute absolute left-3 top-1/2 -translate-y-1/2"
              size={15}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter results"
              className="inp h-9 w-60 rounded-full pl-9 pr-4 text-[13px]"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <Empty
            icon={tab === "orders" ? ShoppingBag : Boxes}
            title={`No ${tab} found`}
            hint="Check that the server is running on port 5000, or clear the filter."
          />
        ) : (
          <div className="scroll max-h-[58vh] overflow-auto rounded-xl">
            <table className="sticky-th w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="divide border-0 border-b border-solid">
                  {tab === "orders" ? (
                    <>
                      <th className={th}>Order</th>
                      <th className={th}>Item</th>
                      <th className={th}>Status</th>
                      <th className={`${th} text-right`}>Action</th>
                    </>
                  ) : (
                    <>
                      <th className={th}>SKU</th>
                      <th className={th}>Product</th>
                      <th className={th}>Price</th>
                      <th className={`${th} text-right`}>Stock</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  tab === "orders" ? (
                    <tr
                      key={r.id}
                      className="divide border-0 border-b border-solid transition hover:bg-violet-500/5"
                    >
                      <td className="t-main py-3 font-extrabold">#{r.id}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={r.item} size={30} />
                          <span className="t-sub font-semibold">{r.item}</span>
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge status={r.status} />
                      </td>
                      <td className="py-3 text-right">
                        <Btn
                          v="danger"
                          onClick={() => onCancel(r.id)}
                          disabled={r.status === "Cancelled"}
                        >
                          <XCircle size={14} /> Cancel
                        </Btn>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={r.id}
                      className="divide border-0 border-b border-solid transition hover:bg-violet-500/5"
                    >
                      <td className="t-mute py-3 font-mono text-xs">
                        {r.sku || r.id}
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={r.name} size={30} />
                          <span className="t-main font-bold">{r.name}</span>
                        </span>
                      </td>
                      <td className="t-sub py-3 font-semibold">
                        {r.price != null
                          ? `$${Number(r.price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="t-sub py-3 text-right">
                        {r.stock ?? "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ───────────────────────── CHAT STATE (lives in App so messages persist across pages) ─────────────────────────
   Server contract:
   sendMessage {id, scope:"public"|"room", room, text, role, sender, clientId, time}
     → scope "public": io.emit("newMessage", m)      scope "room": io.to(m.room).emit("newMessage", m)
   joinRoom / leaveRoom {room, ...}   typing {scope, room, sender, clientId}   onlineUsers <number>   roomNotice "text" | {room,text} */
function useChat(page) {
  const [name, setName] = useState(`Guest-${clientId.slice(0, 3)}`);
  const [role, setRole] = useState("customer");
  const [tab, setTab] = useState("public");
  const [room, setRoom] = useState(null);
  const [pub, setPub] = useState([]);
  const [rm, setRm] = useState([]);
  const [unread, setUnread] = useState({ public: 0, room: 0 });
  const [typing, setTyping] = useState(null);
  const [online, setOnline] = useState(null);
  const ref = useRef({});
  ref.current = { page, tab, room };
  const seen = useRef(new Set());
  const typingTimer = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    const add = (scope, msg) =>
      (scope === "public" ? setPub : setRm)((p) => [...p, msg]);
    const onMsg = (raw) => {
      const m =
        typeof raw === "string"
          ? { text: raw, sender: "Server", clientId: "server" }
          : raw;
      const scope = m.scope || (m.room ? "room" : "public");
      if (scope === "room" && m.room !== ref.current.room) return;
      if (m.id) {
        if (seen.current.has(m.id)) return;
        seen.current.add(m.id);
      }
      add(scope, { ...m, scope, time: m.time || time() });
      setTyping(null);
      const viewing = ref.current.page === "chat" && ref.current.tab === scope;
      if (m.clientId !== clientId && !viewing)
        setUnread((u) => ({ ...u, [scope]: u[scope] + 1 }));
    };
    const onNotice = (n) => {
      const d = typeof n === "string" ? { text: n } : n;
      if (d.room && d.room !== ref.current.room) return;
      add("room", { system: true, text: d.text, time: time() });
    };
    const onTyping = (d) => {
      if (d.clientId === clientId) return;
      if (d.scope === "room" && d.room !== ref.current.room) return;
      setTyping({ scope: d.scope || "public", name: d.sender || "Someone" });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 1600);
    };
    socket.on("newMessage", onMsg);
    socket.on("roomNotice", onNotice);
    socket.on("typing", onTyping);
    socket.on("onlineUsers", setOnline);
    return () => {
      socket.off("newMessage", onMsg);
      socket.off("roomNotice", onNotice);
      socket.off("typing", onTyping);
      socket.off("onlineUsers", setOnline);
    };
  }, []);

  useEffect(() => {
    if (page === "chat") setUnread((u) => (u[tab] ? { ...u, [tab]: 0 } : u));
  }, [page, tab, pub.length, rm.length]);

  const join = (id) => {
    const r = id.trim();
    if (!r) return toast.error("Type a room ID to join");
    if (!name.trim()) return toast.error("Add your name first");
    if (room) socket.emit("leaveRoom", { room });
    socket.emit("joinRoom", { room: r, role, name: name.trim(), clientId });
    setRoom(r);
    setTab("room");
    setRm([
      {
        system: true,
        text: `You joined “${r}” as ${role === "customer" ? "a customer" : "a support agent"}`,
        time: time(),
      },
    ]);
  };
  const leave = () => {
    socket.emit("leaveRoom", { room });
    setRoom(null);
    setRm([]);
    setTab("public");
  };
  const send = (text, scope) => {
    const t = text.trim();
    if (!t) return;
    const m = {
      id: `${clientId}-${Date.now()}`,
      scope,
      room: scope === "room" ? room : undefined,
      text: t,
      role,
      sender: name.trim() || "Guest",
      clientId,
      time: time(),
    };
    seen.current.add(m.id);
    (scope === "public" ? setPub : setRm)((p) => [...p, m]);
    socket.emit("sendMessage", m);
  };
  const notifyTyping = (scope) => {
    if (Date.now() - lastTyping.current < 800) return;
    lastTyping.current = Date.now();
    socket.emit("typing", { scope, room, sender: name, clientId });
  };
  return {
    name,
    setName,
    role,
    setRole,
    tab,
    setTab,
    room,
    pub,
    rm,
    unread,
    typing,
    online,
    join,
    leave,
    send,
    notifyTyping,
  };
}

/* ───────────────────────── PAGE: LIVE CHAT ───────────────────────── */
function Chat({ chat, connected, orders }) {
  const {
    name,
    setName,
    role,
    setRole,
    tab,
    setTab,
    room,
    pub,
    rm,
    unread,
    typing,
    online,
    join,
    leave,
    send,
    notifyTyping,
  } = chat;
  const [roomInput, setRoomInput] = useState("");
  const [input, setInput] = useState("");
  const [emoji, setEmoji] = useState(false);
  const boxRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);
  const list = tab === "public" ? pub : rm;
  const canSend = tab === "public" || !!room;
  const quick = orders.slice(0, 4).map((o) => `order-${o.id}`);

  const toBottom = useCallback((smooth = true) => {
    const el = boxRef.current;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
  }, []);
  useEffect(() => {
    const last = list[list.length - 1];
    if (atBottom || last?.clientId === clientId) toBottom();
    // eslint-disable-next-line
  }, [list.length, typing]);
  useEffect(() => {
    toBottom(false);
    setAtBottom(true);
  }, [tab, toBottom]);
  const onScroll = (e) => {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };
  const submit = () => {
    send(input, tab);
    setInput("");
    setEmoji(false);
  };

  const RoleTag = ({ r }) =>
    r ? (
      <span
        className={`tone tone-${r === "agent" ? "violet" : "sky"} rounded-md px-1.5 py-0.5 text-[10px] font-extrabold`}
      >
        {r === "agent" ? "Agent" : "Customer"}
      </span>
    ) : null;

  return (
    <>
      <Hero
        title="Live chat"
        icon={MessageCircle}
        grad="from-cyan-500 via-sky-500 to-indigo-600"
        protocol="WebSocket · Socket.io"
        desc="Talk with everyone in the public channel, or open a private 1-on-1 room between a customer and a support agent."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-white/20 px-3.5 text-xs font-bold text-white backdrop-blur">
          {connected ? <Wifi size={14} /> : <Spinner />}{" "}
          {connected ? "Socket connected" : "Connecting…"}
        </span>
      </Hero>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <div className="order-2 space-y-5 xl:order-1">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={name} size={44} />
              <div className="min-w-0">
                <p className="t-main m-0 truncate font-bold">
                  {name || "Guest"}
                </p>
                <p className="t-mute m-0 text-xs">
                  {role === "agent" ? "Support agent" : "Customer"}
                </p>
              </div>
            </div>
            <label className="t-mute mb-1 block text-xs font-bold">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="inp mb-3 h-9 w-full rounded-xl px-3 text-[13px]"
            />
            <label className="t-mute mb-1 block text-xs font-bold">
              I am a
            </label>
            <div className="seg w-full">
              <button
                disabled={!!room}
                onClick={() => setRole("customer")}
                className={`seg-btn flex-1 justify-center ${role === "customer" ? "on" : ""}`}
              >
                <User size={14} /> Customer
              </button>
              <button
                disabled={!!room}
                onClick={() => setRole("agent")}
                className={`seg-btn flex-1 justify-center ${role === "agent" ? "on" : ""}`}
              >
                <Headset size={14} /> Agent
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <Lock size={15} className="text-violet-500" />
              <h3 className="t-main m-0 text-base font-bold">Private room</h3>
            </div>
            <p className="t-mute m-0 mb-3 text-xs">
              Only people using the same room ID can read it.
            </p>
            {room ? (
              <div className="tone tone-green flex items-center justify-between rounded-2xl p-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold opacity-80">
                    Connected to
                  </span>
                  <span className="t-main block truncate text-sm font-extrabold">
                    {room}
                  </span>
                </span>
                <Btn v="danger" onClick={leave}>
                  <LogOut size={14} /> Leave
                </Btn>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && join(roomInput)}
                    placeholder="e.g. order-1001"
                    className="inp h-9 min-w-0 flex-1 rounded-xl px-3 text-[13px]"
                  />
                  <Btn v="primary" onClick={() => join(roomInput)}>
                    <LogIn size={14} /> Join
                  </Btn>
                </div>
                {quick.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quick.map((r) => (
                      <button
                        key={r}
                        className="chip"
                        onClick={() => setRoomInput(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <Card
          className="order-1 flex flex-col overflow-hidden xl:order-2"
          style={{ height: "clamp(460px, calc(100dvh - 240px), 720px)" }}
        >
          <div className="divide flex flex-wrap items-center justify-between gap-3 border-0 border-b border-solid px-5 py-3">
            <div className="seg">
              <button
                className={`seg-btn ${tab === "public" ? "on" : ""}`}
                onClick={() => setTab("public")}
              >
                <Globe size={14} /> Public{" "}
                {unread.public > 0 && (
                  <span className="pill">{unread.public}</span>
                )}
              </button>
              <button
                className={`seg-btn ${tab === "room" ? "on" : ""}`}
                onClick={() => setTab("room")}
              >
                <Lock size={14} /> Room{" "}
                {unread.room > 0 && <span className="pill">{unread.room}</span>}
              </button>
            </div>
            {tab === "public" ? (
              <span className="t-mute flex items-center gap-2 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {online != null
                  ? `${online} online`
                  : "Everyone can see this channel"}
              </span>
            ) : room ? (
              <span className="tone tone-green flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                {room}
              </span>
            ) : null}
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={boxRef}
              onScroll={onScroll}
              className="chat-bg scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-4"
            >
              {tab === "room" && !room ? (
                <Empty
                  icon={Lock}
                  title="You're not in a room yet"
                  hint="Enter a room ID and share it with the other person to chat privately."
                >
                  <div className="flex w-full max-w-xs gap-2">
                    <input
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && join(roomInput)}
                      placeholder="Room ID"
                      className="inp h-9 min-w-0 flex-1 rounded-xl px-3 text-[13px]"
                    />
                    <Btn v="primary" onClick={() => join(roomInput)}>
                      <LogIn size={14} /> Join
                    </Btn>
                  </div>
                  {quick.slice(0, 3).map((r) => (
                    <button key={r} className="chip" onClick={() => join(r)}>
                      Join {r}
                    </button>
                  ))}
                </Empty>
              ) : list.length === 0 ? (
                <Empty
                  icon={MessageCircle}
                  title="No messages yet"
                  hint="Say hello. Messages appear here in real time."
                />
              ) : (
                list.map((m, i) => {
                  if (m.system)
                    return (
                      <p
                        key={i}
                        className="t-mute mx-auto my-3 w-fit rounded-full px-3 py-1 text-center text-xs font-semibold"
                        style={{ background: "var(--hover)" }}
                      >
                        {m.text}
                      </p>
                    );
                  const mine = m.clientId === clientId;
                  const prev = list[i - 1];
                  const first =
                    !prev || prev.system || prev.clientId !== m.clientId;
                  return (
                    <div
                      key={m.id || i}
                      className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""} ${first ? "mt-3" : ""}`}
                    >
                      <div className="w-8 shrink-0">
                        {first && <Avatar name={m.sender} />}
                      </div>
                      <div
                        className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}
                      >
                        {first && (
                          <div className="mb-1 flex items-center gap-2 text-xs">
                            <span className="t-main font-bold">
                              {mine ? "You" : m.sender}
                            </span>
                            <RoleTag r={m.role} />
                            <span className="t-mute">{m.time}</span>
                          </div>
                        )}
                        <div
                          className={`px-3.5 py-2 text-sm leading-snug ${mine ? "bubble-me" : "bub"} ${first ? (mine ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md") : "rounded-2xl"}`}
                        >
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typing && typing.scope === tab && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="bub inline-flex gap-1 rounded-2xl px-3.5 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="t-mute h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </div>
                  <span className="t-mute text-xs">
                    {typing.name} is typing
                  </span>
                </div>
              )}
            </div>
            {!atBottom && list.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                <button
                  onClick={() => toBottom()}
                  className="btn btn-primary pointer-events-auto"
                >
                  <ChevronDown size={14} /> Latest messages
                </button>
              </div>
            )}
          </div>

          <div className="divide relative border-0 border-t border-solid p-3.5">
            {emoji && (
              <div className="card absolute bottom-16 left-4 z-10 flex gap-1 rounded-2xl p-1.5">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    onClick={() => setInput((v) => v + e)}
                    className="icon-btn !h-8 !w-8 !border-0 !bg-transparent !shadow-none text-base"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                className="icon-btn"
                disabled={!canSend}
                onClick={() => setEmoji(!emoji)}
                aria-label="Emoji"
              >
                <Smile size={17} />
              </button>
              <input
                disabled={!canSend}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  notifyTyping(tab);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={
                  canSend
                    ? tab === "public"
                      ? "Message everyone…"
                      : `Message ${room}…`
                    : "Join a room to start chatting"
                }
                className="inp h-9 min-w-0 flex-1 rounded-full px-4 text-[13px] disabled:opacity-50"
              />
              <Btn
                v="primary"
                s="md"
                onClick={submit}
                disabled={!canSend || !input.trim()}
                aria-label="Send message"
                className="!rounded-full !px-4"
              >
                <Send size={14} /> Send
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────── PAGE: JSON-RPC CONSOLE ───────────────────────── */
function RpcConsole({ orders, applyCancel }) {
  const [method, setMethod] = useState("cancelOrder");
  const [params, setParams] = useState('{\n  "orderId": 1\n}');
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const call = async () => {
    let parsed;
    try {
      parsed = JSON.parse(params || "{}");
    } catch {
      return toast.error("Params must be valid JSON");
    }
    const request = { jsonrpc: "2.0", method, params: parsed, id: Date.now() };
    setBusy(true);
    let response;
    try {
      response = await fetch(`${API}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }).then((r) => r.json());
      if (response.error) toast.error(response.error.message);
      else {
        toast.success(
          typeof response.result === "string"
            ? response.result
            : "Call succeeded",
        );
        if (method === "cancelOrder") applyCancel(parsed.orderId);
      }
    } catch {
      response = { error: { code: -32603, message: "Could not reach /rpc" } };
      toast.error("Could not reach /rpc");
    }
    setLog((p) => [{ request, response, time: time() }, ...p]);
    setBusy(false);
  };

  const presets = [
    { m: "cancelOrder", p: '{\n  "orderId": 1\n}' },
    { m: "getOrder", p: '{\n  "orderId": 1\n}' },
    { m: "updateStatus", p: '{\n  "orderId": 1,\n  "status": "Shipped"\n}' },
  ];

  return (
    <>
      <Hero
        title="Action console"
        icon={Terminal}
        grad="from-violet-600 via-purple-600 to-fuchsia-500"
        protocol="JSON-RPC 2.0 · POST /rpc"
        desc="Send method-based commands to the server and inspect the raw request and response."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="t-main m-0 mb-4 text-base font-bold">
            Compose a call
          </h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.m}
                onClick={() => {
                  setMethod(p.m);
                  setParams(p.p);
                }}
                className={`chip !normal-case ${method === p.m ? "on" : ""}`}
              >
                {p.m}
              </button>
            ))}
          </div>
          <label className="t-mute mb-1 block text-xs font-bold">Method</label>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="inp mb-3 h-9 w-full rounded-xl px-3 font-mono text-[13px]"
          />
          <label className="t-mute mb-1 block text-xs font-bold">
            Params (JSON)
          </label>
          <textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            rows={7}
            spellCheck={false}
            className="code w-full resize-none rounded-xl border-0 p-4 font-mono text-[13px] focus:outline focus:outline-2 focus:outline-violet-500"
          />
          {orders.length > 0 && (
            <p className="t-mute m-0 mt-2 text-xs">
              Known order IDs: {orders.map((o) => o.id).join(", ")}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Btn v="primary" s="md" onClick={call} disabled={busy}>
              {busy ? <Spinner /> : <Play size={14} />}{" "}
              {busy ? "Sending" : "Send request"}
            </Btn>
            <Btn v="outline" s="md" onClick={() => setLog([])}>
              <Trash2 size={14} /> Clear log
            </Btn>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="t-main m-0 mb-4 text-base font-bold">Request log</h3>
          {log.length === 0 ? (
            <Empty
              icon={Terminal}
              title="No calls yet"
              hint="Send a request and the JSON exchange will appear here."
            />
          ) : (
            <div className="scroll max-h-[500px] space-y-3 overflow-y-auto pr-1">
              {log.map((l, i) => (
                <div key={i} className="code rounded-2xl p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-300">
                      {l.request.method}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${l.response.error ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}
                    >
                      {l.response.error ? "Error" : "OK"} · {l.time}
                    </span>
                  </div>
                  <pre className="m-0 overflow-x-auto text-xs leading-relaxed text-slate-300">
                    {JSON.stringify(l.request, null, 2)}
                  </pre>
                  <pre
                    className={`m-0 mt-2 overflow-x-auto border-0 border-t border-solid border-white/10 pt-2 text-xs leading-relaxed ${l.response.error ? "text-rose-300" : "text-emerald-300"}`}
                  >
                    {JSON.stringify(l.response, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────── PAGE: SSE ALERTS ───────────────────────── */
function Alerts({ alerts, sseUp, clear }) {
  const [filter, setFilter] = useState("all");
  const list = alerts.filter((a) => filter === "all" || a.severity === filter);
  return (
    <>
      <Hero
        title="System alerts"
        icon={Radio}
        grad="from-emerald-500 via-teal-500 to-cyan-500"
        protocol="Server-Sent Events · GET /events"
        desc="A one-way live stream from the server. New alerts appear the moment they are sent."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-white/20 px-3.5 text-xs font-bold text-white backdrop-blur">
          {sseUp ? <Plug size={14} /> : <Spinner />}{" "}
          {sseUp ? "Stream connected" : "Reconnecting…"}
        </span>
        <Btn v="glass" onClick={clear}>
          <Trash2 size={14} /> Clear
        </Btn>
      </Hero>
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {["all", "info", "success", "warning", "critical"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? "on" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty
            icon={Radio}
            title="Listening for alerts"
            hint="Nothing has arrived yet. Trigger an event on the server to see it here."
          />
        ) : (
          <ul className="scroll m-0 max-h-[60vh] list-none space-y-2.5 overflow-y-auto p-0 pr-1">
            {list.map((a) => {
              const S = SEV[a.severity] || SEV.info;
              return (
                <li
                  key={a.id}
                  className={`tone tone-${S.tone} flex items-start gap-3.5 rounded-2xl p-3.5 text-left`}
                >
                  <S.icon size={18} className="mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="t-main m-0 text-sm font-bold">{a.message}</p>
                    <p className="t-mute m-0 text-xs capitalize">
                      {a.severity} · {a.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ───────────────────────── APP SHELL ───────────────────────── */
export default function App() {
  const [theme, setTheme] = useState("light");
  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [source, setSource] = useState("rest");
  const [loading, setLoading] = useState(true);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [sseUp, setSseUp] = useState(false);
  const [minDone, setMinDone] = useState(false);
  const [splash, setSplash] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const chat = useChat(page);
  const totalUnread = chat.unread.public + chat.unread.room;

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1800);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (firstLoaded && minDone) {
      setLeaving(true);
      const t = setTimeout(() => setSplash(false), 550);
      return () => clearTimeout(t);
    }
  }, [firstLoaded, minDone]);

  /* 1 · REST or GraphQL */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (source === "rest") {
        const [o, c] = await Promise.all([
          fetch(`${API}/api/v1/orders`).then((r) => r.json()),
          fetch(`${API}/api/v1/catalog`)
            .then((r) => r.json())
            .catch(() => ({ data: [] })),
        ]);
        setOrders(o.data || []);
        setCatalog(c.data || []);
      } else {
        const query =
          "{ orders { id item status } catalog { id sku name price stock } }";
        const res = await fetch(`${API}/graphql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }).then((r) => r.json());
        if (res.errors) throw new Error(res.errors[0].message);
        setOrders(res.data.orders || []);
        setCatalog(res.data.catalog || []);
      }
    } catch {
      toast.error(
        `Failed to load data via ${source === "rest" ? "REST" : "GraphQL"}`,
      );
    }
    setLoading(false);
    setFirstLoaded(true);
  }, [source]);
  useEffect(() => {
    load();
  }, [load]);

  /* 2 · Socket.io connection + live order status */
  useEffect(() => {
    const up = () => setConnected(true),
      down = () => setConnected(false);
    const onStatus = ({ id, status }) => {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
      toast(`Order #${id} is now ${status}`, { icon: "📦" });
    };
    socket.on("connect", up);
    socket.on("disconnect", down);
    socket.on("orderStatusUpdate", onStatus);
    return () => {
      socket.off("connect", up);
      socket.off("disconnect", down);
      socket.off("orderStatusUpdate", onStatus);
    };
  }, []);

  /* 4 · SSE */
  useEffect(() => {
    const es = new EventSource(`${API}/events`);
    es.onopen = () => setSseUp(true);
    es.onerror = () => setSseUp(false);
    es.onmessage = (e) => {
      let d;
      try {
        d = JSON.parse(e.data);
      } catch {
        d = { message: e.data };
      }
      const a = {
        id: Date.now() + Math.random(),
        message: d.message || "System event",
        severity: d.severity || "info",
        time: time(),
      };
      setAlerts((p) => [a, ...p].slice(0, 100));
      toast(a.message, { icon: "🔔" });
    };
    return () => es.close();
  }, []);

  /* 3 · JSON-RPC cancel */
  const applyCancel = (id) =>
    setOrders((p) =>
      p.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o)),
    );
  const cancelOrder = async (orderId) => {
    try {
      const data = await fetch(`${API}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "cancelOrder",
          params: { orderId },
          id: Date.now(),
        }),
      }).then((r) => r.json());
      if (data.error) toast.error(data.error.message);
      else {
        toast.success(data.result);
        applyCancel(orderId);
      }
    } catch {
      toast.error("Could not reach /rpc");
    }
  };

  const contentRef = useRef(null);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [page]);
  const go = (id) => setPage(id);
  const current = NAV.find((n) => n.id === page);

  const sidebar = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
            <Package size={21} />
          </div>
          <div>
            <p className="disp t-main m-0 text-xl font-extrabold leading-none">
              SystemHub
            </p>
            <p className="t-mute m-0 mt-1 text-xs">Order desk</p>
          </div>
        </div>
        <nav className="space-y-1 px-4">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`nav-item ${page === n.id ? "nav-on" : ""}`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${page === n.id ? `bg-gradient-to-br ${n.grad} text-white shadow-md` : "t-mute"}`}
                style={
                  page === n.id ? undefined : { background: "var(--hover)" }
                }
              >
                <n.icon size={17} />
              </span>
              <span className="flex-1">
                <span
                  className={`block text-[13px] font-bold ${page === n.id ? "t-main" : "t-sub"}`}
                >
                  {n.label}
                </span>
                <span className="t-mute block text-[11px]">{n.tag}</span>
              </span>
              {n.id === "chat" && totalUnread > 0 && (
                <span className="pill">{totalUnread}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="card m-4 rounded-2xl p-4">
        <p className="t-mute m-0 mb-3 text-xs font-bold">Connections</p>
        {[
          ["Socket.io", connected],
          ["SSE stream", sseUp],
        ].map(([l, up]) => (
          <div
            key={l}
            className="t-sub mb-1.5 flex items-center justify-between text-[13px] font-semibold"
          >
            {l}
            <span
              className={`h-2.5 w-2.5 rounded-full ${up ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-rose-500"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="hub" data-theme={theme}>
      <style>{CSS}</style>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            background: "var(--solid)",
            color: "var(--text)",
            boxShadow: "0 0 0 1px var(--ring), var(--shadow)",
            fontWeight: 600,
            fontSize: 13,
          },
        }}
      />
      {loading && !splash && <div className="topbar" />}
      {splash && (
        <Splash
          out={leaving}
          steps={[
            ["Orders & catalog", firstLoaded],
            ["Live socket", connected],
            ["Alert stream", sseUp],
          ]}
        />
      )}

      <div className="blob -left-24 -top-24 h-[420px] w-[420px] bg-fuchsia-400" />
      <div
        className="blob -bottom-24 right-0 h-[420px] w-[420px] bg-cyan-400"
        style={{ animationDelay: "-7s" }}
      />

      <aside
        className="side relative z-10 w-72 shrink-0"
        style={{
          background: "var(--side)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid var(--ring)",
        }}
      >
        {sidebar}
      </aside>
      <nav className="mnav" aria-label="Main navigation">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className={`mnav-item ${page === n.id ? "on" : ""}`}
            aria-label={n.label}
            aria-current={page === n.id ? "page" : undefined}
          >
            <span className="mi">
              <n.icon size={17} />
            </span>
            {SHORT[n.id]}
            {n.id === "chat" && totalUnread > 0 && (
              <span className="pill">{totalUnread}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className="flex h-16 shrink-0 items-center justify-between px-4 md:px-10"
          style={{
            background: "var(--side)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--ring)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="only-m items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md">
                <Package size={18} />
              </div>
              <div>
                <p className="disp t-main m-0 text-base font-extrabold leading-none">
                  SystemHub
                </p>
                <p className="t-mute m-0 mt-0.5 text-[11px] font-semibold">
                  {current?.label}
                </p>
              </div>
            </div>
            <p className="only-d t-sub m-0 text-sm font-bold">
              {current?.label}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="icon-btn"
              aria-label="Switch theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => go("alerts")}
              className="icon-btn"
              aria-label="Alerts"
            >
              <Radio size={17} />
              {alerts.length > 0 && (
                <span className="pill absolute -right-1.5 -top-1.5">
                  {alerts.length > 99 ? "99+" : alerts.length}
                </span>
              )}
            </button>
            <div className="ml-2 hidden text-right sm:block">
              <p className="t-main m-0 text-[13px] font-bold">Admin User</p>
              <p className="t-mute m-0 text-xs">System support</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
              <User size={17} />
            </div>
          </div>
        </header>

        <div
          ref={contentRef}
          className="content scroll min-h-0 flex-1 overflow-y-auto p-4 md:p-8"
        >
          <div key={page} className="page mx-auto w-full max-w-[1400px]">
            {page === "dashboard" && (
              <Dashboard
                {...{ orders, catalog, alerts, connected, sseUp, go, loading }}
              />
            )}
            {page === "resources" && (
              <Resources
                {...{
                  orders,
                  catalog,
                  source,
                  setSource,
                  reload: load,
                  loading,
                  onCancel: cancelOrder,
                }}
              />
            )}
            {page === "chat" && (
              <Chat chat={chat} connected={connected} orders={orders} />
            )}
            {page === "rpc" && (
              <RpcConsole orders={orders} applyCancel={applyCancel} />
            )}
            {page === "alerts" && (
              <Alerts
                alerts={alerts}
                sseUp={sseUp}
                clear={() => setAlerts([])}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
