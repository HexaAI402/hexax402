"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Command as CommandIcon,
  Github,
  X as XIcon,
  Wallet,
  Terminal,
  Layers,
  Route,
  BookOpen,
  Cpu,
  GripVertical,
  Pause,
  Play,
  Filter,
  Search,
  AlertTriangle,
  Shield,
  Globe,
  CheckCircle2,
} from "lucide-react";

type Tab = "terminal" | "routes" | "depth" | "pipeline" | "docs";
type Level = "INFO" | "WARN" | "ERROR";

/* -------------------- LAUNCH LINKS (already set) -------------------- */
const LINKS = {
  x: "https://x.com/HexaAI402",
  github: "https://github.com/hexaai402",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* -------------------- Small fetch helper (launch-safe) -------------------- */
async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 3500
): Promise<{ ok: true; data: T; ms: number } | { ok: false; error: string; ms: number }> {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    const ms = Math.round(performance.now() - t0);
    clearTimeout(id);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}${txt ? ` — ${txt.slice(0, 140)}` : ""}`, ms };
    }
    const data = (await res.json()) as T;
    return { ok: true, data, ms };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t0);
    clearTimeout(id);
    const msg =
      e?.name === "AbortError"
        ? `timeout after ${timeoutMs}ms`
        : e?.message || "request failed";
    return { ok: false, error: msg, ms };
  }
}

/* -------------------- Solana wallet detection (safe) -------------------- */
type WalletStatus = "DISCONNECTED" | "CONNECTED" | "UNAVAILABLE";

function getSolProvider(): any | null {
  const w = window as any;
  if (w?.solana?.isPhantom) return w.solana;
  if (w?.solflare) return w.solflare;
  if (w?.solana) return w.solana;
  return null;
}

function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/* -------------------- Boot overlay (launch tone) -------------------- */
function BootOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = useMemo(
    () => [
      "hexa://boot v1.0.0",
      "verifying runtime integrity…",
      "mounting telemetry bus…",
      "warming edge cache…",
      "opening routing fabric…",
      "console ready.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= lines.length) {
          clearInterval(id);
          setTimeout(onDone, 250);
          return s;
        }
        return s + 1;
      });
    }, 220);
    return () => clearInterval(id);
  }, [lines.length, onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-xl px-6">
        <div className="glass glow p-6 mono">
          <div className="flex items-center justify-between">
            <div className="pill px-3 py-1 text-xs tracking-widest text-white/85">
              LAUNCH INITIALIZE
            </div>
            <div className="text-xs text-white/55">secure runtime</div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {lines.slice(0, step).map((l, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-white/45">•</span>
                <span className="text-white/90">{l}</span>
              </div>
            ))}
            <div className="mt-3 text-white/55">
              starting… <span className="blink" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- Network graph background -------------------- */
function NetworkGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const N = 70;
    const pts = Array.from({ length: N }).map(() => ({
      x: Math.random() * 1200,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 1.6,
    }));

    function step() {
      raf = requestAnimationFrame(step);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.18;
            ctx.strokeStyle = `rgba(255, 0, 80, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of pts) {
        ctx.fillStyle = "rgba(255,0,80,0.72)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,0,80,0.12)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    step();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-[18px]">
      <canvas ref={canvasRef} className="h-full w-full opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,80,0.18),transparent_60%),radial-gradient(circle_at_70%_30%,rgba(255,0,80,0.10),transparent_55%)]" />
    </div>
  );
}

/* -------------------- Tilt card -------------------- */
function TiltCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -10;
    const ry = (px - 0.5) * 12;

    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `35%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("tilt glass glow relative overflow-hidden", className)}
    >
      <div className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(500px_300px_at_var(--mx,50%)_var(--my,35%),rgba(255,0,80,0.22),transparent_60%)]" />
      {children}
    </div>
  );
}

/* -------------------- Command Palette -------------------- */
type Cmd = { id: string; label: string; hint: string; action: () => void };

function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Cmd[];
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(s) || c.hint.toLowerCase().includes(s)
    );
  }, [q, commands]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TiltCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="pill mono inline-flex items-center gap-2 px-3 py-1 text-xs tracking-widest text-white/85">
                  <CommandIcon size={14} />
                  COMMAND
                </div>
                <div className="mono text-xs text-white/55">Ctrl/⌘ + K</div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Search className="text-white/60" size={18} />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input mono text-sm"
                  placeholder="Search actions…"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                    if (e.key === "Enter" && filtered[0]) {
                      filtered[0].action();
                      onClose();
                    }
                  }}
                />
              </div>

              <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-white/10 bg-black/30">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    onClick={() => {
                      c.action();
                      onClose();
                    }}
                  >
                    <div className="mono text-sm text-white/90">{c.label}</div>
                    <div className="mono text-xs text-white/55">{c.hint}</div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-8 text-center mono text-sm text-white/55">
                    No matches.
                  </div>
                )}
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------- Live telemetry charts -------------------- */
type TelemetryPoint = { t: string; latency: number; throughput: number; cpu: number };

function makePoint(i: number): TelemetryPoint {
  const base = Date.now();
  const t = new Date(base - (30 - i) * 1000);
  const label = t.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });

  const latency =
    10 + Math.round(8 + 7 * Math.sin(base / 1400 + i / 3) + Math.random() * 4);
  const throughput =
    180 + Math.round(40 * Math.sin(base / 1700 + i / 4) + Math.random() * 25);
  const cpu =
    15 + Math.round(12 * Math.sin(base / 2200 + i / 5) + Math.random() * 8);

  return { t: label, latency, throughput, cpu };
}

function TelemetryCharts() {
  const [data, setData] = useState<TelemetryPoint[]>(
    () => Array.from({ length: 30 }).map((_, i) => makePoint(i))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const next = prev.slice(1);
        next.push(makePoint(29));
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-4">
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="mono text-xs uppercase tracking-widest text-white/55">LATENCY</div>
          <div className="mono text-xs text-white/55">ms</div>
        </div>
        <div className="mt-3 h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.75)" }}
              />
              <Line type="monotone" dataKey="latency" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="mono text-xs uppercase tracking-widest text-white/55">THROUGHPUT</div>
          <div className="mono text-xs text-white/55">req/s</div>
        </div>
        <div className="mt-3 h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.75)" }}
              />
              <Area type="monotone" dataKey="throughput" strokeWidth={2} fillOpacity={0.18} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="mono text-xs uppercase tracking-widest text-white/55">CPU</div>
          <div className="mono text-xs text-white/55">%</div>
        </div>
        <div className="mt-3 h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.75)" }}
              />
              <Line type="monotone" dataKey="cpu" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* -------------------- log stream -------------------- */
type Log = { id: string; t: string; level: Level; msg: string };

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
}

function randomLog(): Log {
  const levels: Level[] = ["INFO", "WARN", "ERROR"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const msgs = [
    "edge: route cache warmed",
    "telemetry: packet received",
    "policy: request authorized",
    "engine: quote computed",
    "ws: client subscribed",
    "auth: token rotated",
    "pipeline: normalize stage complete",
    "settle: acknowledgement received",
    "alert: jitter spike detected",
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  return { id: crypto.randomUUID(), t: nowLabel(), level, msg };
}

function LogStream() {
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Log[]>(() =>
    Array.from({ length: 16 }).map(() => randomLog())
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setItems((prev) => [...prev.slice(-39), randomLog()]);
    }, 950);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((x) => {
      if (level !== "ALL" && x.level !== level) return false;
      if (s && !`${x.level} ${x.msg}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items, level, q]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="mono text-xs uppercase tracking-widest text-white/55">
          EVENT LOG
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-ghost mono text-xs"
            onClick={() => setPaused((p) => !p)}
          >
            <span className="inline-flex items-center gap-2">
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "resume" : "pause"}
            </span>
          </button>

          <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/80">
            <span className="inline-flex items-center gap-2">
              <Filter size={14} /> {level}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {(["ALL", "INFO", "WARN", "ERROR"] as const).map((k) => (
          <button
            key={k}
            className={cn(
              "mono rounded-xl border px-3 py-2 text-xs transition",
              level === k
                ? "border-white/22 bg-white/10 text-white"
                : "border-white/10 bg-black/30 text-white/70 hover:bg-white/6"
            )}
            onClick={() => setLevel(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Search size={16} className="text-white/60" />
        <input
          className="input mono text-sm"
          placeholder="search events…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-white/10 bg-black/30">
        {filtered.map((x) => (
          <div
            key={x.id}
            className="flex gap-3 px-3 py-2 border-b border-white/5 last:border-b-0"
          >
            <div className="mono text-xs text-white/55 w-[70px]">{x.t}</div>
            <div className="mono text-xs w-[56px]">
              <span className="pill px-2 py-0.5">{x.level}</span>
            </div>
            <div className="mono text-xs text-white/80">{x.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Draggable panel -------------------- */
function DraggablePanel({
  title,
  right,
  children,
  initial,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  initial: { x: number; y: number; w: number; h: number };
}) {
  const [pos, setPos] = useState({ x: initial.x, y: initial.y });

  return (
    <motion.div
      className="fixed z-[60]"
      style={{ width: initial.w, height: initial.h, left: 0, top: 0 }}
      drag
      dragMomentum={false}
      dragElastic={0.08}
      onDragEnd={(e, info) =>
        setPos({ x: info.point.x - 40, y: info.point.y - 18 })
      }
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div className="glass glow h-full overflow-hidden">
        <div className="term-topbar handle">
          <GripVertical size={16} className="text-white/60" />
          <div className="mono text-xs text-white/70">{title}</div>
          <div className="ml-auto">{right}</div>
        </div>
        <div className="p-3 h-[calc(100%-44px)] overflow-auto">{children}</div>
      </div>
    </motion.div>
  );
}

/* -------------------- Status cluster -------------------- */
function StatusCluster() {
  return (
    <div className="glass p-3">
      <div className="flex items-center gap-2">
        <div className="pill mono px-2 py-1 text-[10px] tracking-widest text-white/85 inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> OPERATIONAL
        </div>
        <div className="mono text-xs text-white/70">v1.0.0</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="mono text-[11px] text-white/70 inline-flex items-center gap-2">
          <Globe size={14} className="text-white/60" /> us-east
        </div>
        <div className="mono text-[11px] text-white/70 inline-flex items-center gap-2">
          <Shield size={14} className="text-white/60" /> policy
        </div>
        <div className="mono text-[11px] text-white/70 inline-flex items-center gap-2">
          <AlertTriangle size={14} className="text-white/60" /> 0 inc
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main -------------------- */
type HealthResp = { ok: boolean; service?: string; version?: string; region?: string; ts?: string };
type QuoteResp = { ok: boolean; symbol: string; size: number; bid: number; ask: number; ts?: string };

export default function Page() {
  const [boot, setBoot] = useState(true);

  const [tab, setTab] = useState<Tab>("terminal");
  const [cmd, setCmd] = useState("");
  const [palette, setPalette] = useState(false);

  const [walletStatus, setWalletStatus] = useState<WalletStatus>("DISCONNECTED");
  const [walletAddr, setWalletAddr] = useState("");

  // Launch-mode terminal (no demo/dev language)
  const [term, setTerm] = useState<string[]>([
    "hexa://console v1.0.0",
    "runtime: secure",
    "telemetry: active",
    "routing: online",
    "status: operational",
    "type `help` for actions",
  ]);

  function out(line: string) {
    setTerm((x) => [...x, line].slice(-60));
  }

  // detect wallet availability once + subscribe to connect/disconnect
  useEffect(() => {
    const provider = getSolProvider();
    if (!provider) {
      setWalletStatus("UNAVAILABLE");
      return;
    }

    try {
      provider.on?.("connect", () => {
        const pk = provider?.publicKey?.toString?.() || "";
        setWalletStatus("CONNECTED");
        setWalletAddr(pk);
        out(`wallet: connected (${shorten(pk) || "connected"})`);
      });

      provider.on?.("disconnect", () => {
        setWalletStatus("DISCONNECTED");
        setWalletAddr("");
        out("wallet: disconnected");
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWallet() {
    const provider = getSolProvider();
    if (!provider) {
      setWalletStatus("UNAVAILABLE");
      out("wallet: provider not found (install Phantom/Solflare)");
      return;
    }
    try {
      const res = await provider.connect();
      const pk =
        res?.publicKey?.toString?.() ||
        provider?.publicKey?.toString?.() ||
        "";
      setWalletStatus("CONNECTED");
      setWalletAddr(pk);
      out(`wallet: connected (${shorten(pk) || "connected"})`);
    } catch {
      out("wallet: connection cancelled");
    }
  }

  async function disconnectWallet() {
    const provider = getSolProvider();
    try {
      await provider?.disconnect?.();
    } catch {}
    setWalletStatus("DISCONNECTED");
    setWalletAddr("");
    out("wallet: disconnected");
  }

  async function cmdStatus() {
    out("status: querying /api/health …");
    const r = await fetchJson<HealthResp>("/api/health");
    if (!r.ok) {
      out(`status: ERROR (${r.ms}ms) — ${r.error}`);
      return;
    }
    const h = r.data;
    out(`status: OK (${r.ms}ms)`);
    if (h.service) out(`service: ${h.service}`);
    if (h.version) out(`version: ${h.version}`);
    if (h.region) out(`region: ${h.region}`);
    if (h.ts) out(`ts: ${h.ts}`);
  }

  async function cmdRoutes() {
    out("routes: probing edge …");
    const r = await fetchJson<HealthResp>("/api/health");
    if (!r.ok) {
      out(`GET  /api/health      ERROR (${r.ms}ms) — ${r.error}`);
      out("POST /api/quote       READY (edge)");
      out("WS   /stream          OPEN (ui)");
      return;
    }
    out(`GET  /api/health      200 (${r.ms}ms)`);
    out("POST /api/quote       200 (edge)");
    out("WS   /stream          OPEN (ui)");
  }

  async function cmdQuote(symbol: string, size: number) {
    out(`quote: POST /api/quote { symbol=${symbol}, size=${size} } …`);
    const r = await fetchJson<QuoteResp>("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ symbol, size }),
    });
    if (!r.ok) {
      out(`quote: ERROR (${r.ms}ms) — ${r.error}`);
      return;
    }
    const q = r.data;
    out(`quote: OK (${r.ms}ms)`);
    out(`symbol: ${q.symbol}`);
    out(`size:   ${q.size}`);
    out(`bid:    ${q.bid}`);
    out(`ask:    ${q.ask}`);
    if (q.ts) out(`ts:     ${q.ts}`);
  }

  function runCommand(raw: string) {
    const input = raw.trim();
    if (!input) return;

    out(`$ ${input}`);

    if (input === "help") {
      out("actions:");
      out("  status                      (GET /api/health)");
      out("  routes                      (probe endpoints)");
      out("  quote <SYMBOL> <SIZE>       (POST /api/quote)");
      out("  pipeline | docs");
      out("  wallet connect | wallet disconnect");
      out("  tab terminal/routes/depth/pipeline/docs");
      out("examples:");
      out("  quote SOL 3");
      out("  quote HEXA 1");
      return;
    }

    if (input === "wallet connect") return void connectWallet();
    if (input === "wallet disconnect") return void disconnectWallet();

    if (input.startsWith("tab ")) {
      const next = input.replace("tab ", "").trim() as Tab;
      if (["terminal", "routes", "depth", "pipeline", "docs"].includes(next)) {
        setTab(next);
        out(`ui: tab=${next}`);
      } else out("error: unknown tab");
      return;
    }

    if (input === "status") return void cmdStatus();
    if (input === "routes") return void cmdRoutes();

    if (input.startsWith("quote ")) {
      const parts = input.split(/\s+/).slice(1);
      const symbol = String(parts[0] || "").toUpperCase();
      const size = Number(parts[1] || 1);
      if (!symbol) {
        out("quote: missing symbol (example: quote SOL 3)");
        return;
      }
      if (!Number.isFinite(size) || size <= 0) {
        out("quote: invalid size (example: quote SOL 3)");
        return;
      }
      return void cmdQuote(symbol, Math.floor(size));
    }

    if (input === "pipeline") {
      out("pipeline:");
      out("ingest → normalize → validate → execute → settle");
      out("state: green");
      return;
    }

    if (input === "docs") {
      out("docs:");
      out("overview • api • security • deploy");
      return;
    }

    out(`error: unknown command '${input}'`);
  }

  // Ctrl/⌘+K palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      const meta = e.metaKey || e.ctrlKey;
      if (meta && k === "k") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "Escape") setPalette(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: Cmd[] = useMemo(
    () => [
      { id: "tab-terminal", label: "Open: Terminal", hint: "Switch to terminal view", action: () => setTab("terminal") },
      { id: "tab-routes", label: "Open: Routes", hint: "Switch to routes view", action: () => setTab("routes") },
      { id: "tab-depth", label: "Open: Depth", hint: "Switch to depth view", action: () => setTab("depth") },
      { id: "tab-pipeline", label: "Open: Pipeline", hint: "Switch to pipeline view", action: () => setTab("pipeline") },
      { id: "tab-docs", label: "Open: Docs", hint: "Switch to docs view", action: () => setTab("docs") },
      { id: "cmd-status", label: "Run: status", hint: "Fetch /api/health", action: () => runCommand("status") },
      { id: "cmd-routes", label: "Run: routes", hint: "Probe endpoints", action: () => runCommand("routes") },
      { id: "cmd-quote", label: "Run: quote SOL 1", hint: "POST /api/quote", action: () => runCommand("quote SOL 1") },
      { id: "cmd-pipeline", label: "Run: pipeline", hint: "Show pipeline stages", action: () => runCommand("pipeline") },
      { id: "wallet-connect", label: "Wallet: Connect", hint: "Connect a Solana wallet", action: () => connectWallet() },
      { id: "wallet-disconnect", label: "Wallet: Disconnect", hint: "Disconnect wallet", action: () => disconnectWallet() },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walletStatus, walletAddr]
  );

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "terminal", label: "Terminal", icon: <Terminal size={16} /> },
    { key: "routes", label: "Routes", icon: <Route size={16} /> },
    { key: "depth", label: "Depth", icon: <Layers size={16} /> },
    { key: "pipeline", label: "Pipeline", icon: <Cpu size={16} /> },
    { key: "docs", label: "Docs", icon: <BookOpen size={16} /> },
  ];

  const walletLabel =
    walletStatus === "CONNECTED"
      ? shorten(walletAddr) || "Connected"
      : walletStatus === "UNAVAILABLE"
      ? "Install Wallet"
      : "Connect Wallet";

  const walletAction = () => {
    if (walletStatus === "CONNECTED") disconnectWallet();
    else connectWallet();
  };

  return (
    <>
      <AnimatePresence>
        {boot && <BootOverlay onDone={() => setBoot(false)} />}
      </AnimatePresence>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        commands={commands}
      />

      {/* Panels */}
      <DraggablePanel
        title="Telemetry"
        initial={{ x: 30, y: 120, w: 360, h: 420 }}
        right={<div className="mono text-xs text-white/55">live</div>}
      >
        <TelemetryCharts />
      </DraggablePanel>

      <DraggablePanel
        title="Event Log"
        initial={{ x: 410, y: 120, w: 420, h: 420 }}
        right={<div className="mono text-xs text-white/55">filter</div>}
      >
        <LogStream />
      </DraggablePanel>

      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-5 py-10">
          {/* Top bar with real links */}
          <div className="flex items-center justify-between mb-4">
            <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/80">
              HEXA / CONSOLE
            </div>

            <div className="flex items-center gap-2">
              <StatusCluster />

              <a
                className="btn-ghost mono text-sm inline-flex items-center gap-2"
                href={LINKS.x}
                target="_blank"
                rel="noreferrer"
              >
                <XIcon size={16} /> X
              </a>
              <a
                className="btn-ghost mono text-sm inline-flex items-center gap-2"
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={16} /> GitHub
              </a>

              <button
                className="btn mono text-sm inline-flex items-center gap-2"
                onClick={walletAction}
              >
                <Wallet size={16} />
                {walletLabel}
              </button>
            </div>
          </div>

          {/* HERO */}
          <TiltCard className="p-6">
            <NetworkGraphBackground />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/85">
                      OPERATIONAL
                    </div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/80">
                      EDGE ROUTING
                    </div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/70">
                      TELEMETRY BUS
                    </div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/70">
                      CTRL/⌘+K
                    </div>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-white">
                    HEXA <span className="text-white/55">//</span> Infra Console
                  </h1>
                  <p className="mt-2 text-sm text-white/70 mono">
                    production console • secure runtime • observability-first
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn mono text-sm inline-flex items-center gap-2"
                    onClick={() => setPalette(true)}
                  >
                    <CommandIcon size={16} /> command
                  </button>
                  <button
                    className="btn-ghost mono text-sm inline-flex items-center gap-2"
                    onClick={() => setTab("terminal")}
                  >
                    <Terminal size={16} /> console
                  </button>
                </div>
              </div>
            </motion.div>
          </TiltCard>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={cn(
                  "mono inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                  tab === t.key
                    ? "border-white/22 bg-white/10 text-white shadow"
                    : "border-white/10 bg-black/30 text-white/70 hover:bg-white/6 hover:text-white"
                )}
                onClick={() => setTab(t.key)}
              >
                <span className={tab === t.key ? "text-white" : "text-white/60"}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Main grid */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <TiltCard className="lg:col-span-2 p-5">
              {tab === "terminal" ? (
                <div className="terminal">
                  <div className="term-topbar">
                    <span className="dot" />
                    <span className="dot" style={{ opacity: 0.7 }} />
                    <span className="dot" style={{ opacity: 0.45 }} />
                    <span className="ml-2 mono text-xs text-white/70">
                      hexa://console
                    </span>
                  </div>

                  <div className="term-body mono text-sm">
                    {term.map((line, i) => (
                      <div key={i} className="term-line">
                        <span className={line.startsWith("$") ? "prompt" : "dim"}>
                          {line.startsWith("$") ? ">" : "•"}
                        </span>
                        <span className="term-text">{line.replace(/^\$\s?/, "")}</span>
                      </div>
                    ))}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="prompt">{">"}</span>
                      <input
                        className="input mono text-sm"
                        value={cmd}
                        onChange={(e) => setCmd(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            runCommand(cmd);
                            setCmd("");
                          }
                        }}
                        placeholder="type a command… (help)  |  Ctrl/⌘+K"
                        spellCheck={false}
                      />
                      <span className="blink" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass p-4">
                  <div className="mono text-xs uppercase tracking-widest text-white/55">
                    {tab.toUpperCase()}
                  </div>

                  <div className="mt-3 mono text-sm text-white/85 space-y-2">
                    {tab === "routes" && (
                      <>
                        <div>GET  /api/health</div>
                        <div>POST /api/quote</div>
                        <div>WS   /stream</div>
                        <div className="text-white/55">
                          Tip: run <span className="text-white">routes</span> in Terminal to probe live.
                        </div>
                      </>
                    )}
                    {tab === "depth" && (
                      <>
                        <div>Market Depth</div>
                        <div className="text-white/55">bids: ██████████░░░░</div>
                        <div className="text-white/55">asks: █████████░░░░░░</div>
                      </>
                    )}
                    {tab === "pipeline" && (
                      <>
                        <div>ingest → normalize → validate → execute → settle</div>
                        <div className="text-white/55">state: green</div>
                      </>
                    )}
                    {tab === "docs" && (
                      <>
                        <div>Overview</div>
                        <div className="text-white/55">API</div>
                        <div className="text-white/55">Security</div>
                        <div className="text-white/55">Deploy</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </TiltCard>

            <div className="space-y-4">
              <TiltCard className="p-5">
                <div className="mono text-xs uppercase tracking-widest text-white/55">
                  ACTIONS
                </div>
                <div className="mt-4 space-y-3">
                  <button
                    className="btn w-full mono text-sm"
                    onClick={() => out("policy: strict enforcement enabled")}
                  >
                    enable strict policy
                  </button>
                  <button
                    className="btn w-full mono text-sm"
                    onClick={() => out("telemetry: snapshot exported")}
                  >
                    export snapshot
                  </button>
                  <button
                    className="btn-ghost w-full mono text-sm"
                    onClick={() => setPalette(true)}
                  >
                    open command
                  </button>
                  <button
                    className="btn-ghost w-full mono text-sm"
                    onClick={() => runCommand("status")}
                  >
                    run status
                  </button>
                </div>
              </TiltCard>

              <TiltCard className="p-5">
                <div className="mono text-xs uppercase tracking-widest text-white/55">
                  LIVE METRICS
                </div>
                <div className="mt-4">
                  <TelemetryCharts />
                </div>
              </TiltCard>
            </div>
          </div>

          <footer className="mt-10 text-center mono text-xs text-white/45">
            HEXA Console • v1.0.0 • operational
          </footer>
        </div>
      </main>
    </>
  );
}

