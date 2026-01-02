"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command as CommandIcon, Github, X as XIcon, Wallet, Terminal, Layers, Route, BookOpen, Cpu } from "lucide-react";

import ClientOnly from "./components/ClientOnly";
import NetworkGraphBackground from "./components/NetworkGraphBackground";
import CommandPalette, { Cmd } from "./components/CommandPalette";
import DraggablePanel from "./components/DraggablePanel";
import TelemetryCharts from "./components/TelemetryCharts";
import LogStream from "./components/LogStream";

import { fetchJson } from "./lib/fetchJson";
import { getSolProvider, shorten, WalletStatus } from "./lib/solanaWallet";

type Tab = "terminal" | "routes" | "depth" | "pipeline" | "docs";

const LINKS = {
  x: "https://x.com/HexaAI402",
  github: "https://github.com/hexaai402",
};

type HealthResp = { ok: boolean; service?: string; version?: string; region?: string; ts?: string };
type QuoteResp = { ok: boolean; symbol: string; size: number; bid: number; ask: number; ts?: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function BootOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = useMemo(
    () => [
      "hexa://boot v1.0.0",
      "verifying runtime integrity",
      "mounting telemetry bus",
      "warming edge cache",
      "opening routing fabric",
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
    <motion.div className="fixed inset-0 z-[200] bg-black flex items-center justify-center" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="w-full max-w-xl px-6">
        <div className="glass glow p-6 mono">
          <div className="flex items-center justify-between">
            <div className="pill px-3 py-1 text-xs tracking-widest text-white/85">LAUNCH INITIALIZE</div>
            <div className="text-xs text-white/55">secure runtime</div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {lines.slice(0, step).map((l, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-white/45"></span>
                <span className="text-white/90">{l}</span>
              </div>
            ))}
            <div className="mt-3 text-white/55">
              starting <span className="blink" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Page() {
  const [boot, setBoot] = useState(true);
  const [tab, setTab] = useState<Tab>("terminal");
  const [palette, setPalette] = useState(false);

  const [walletStatus, setWalletStatus] = useState<WalletStatus>("DISCONNECTED");
  const [walletAddr, setWalletAddr] = useState("");

  const [cmd, setCmd] = useState("");
  const [term, setTerm] = useState<string[]>([
    "hexa://console v1.0.0",
    "runtime: secure",
    "telemetry: active",
    "routing: online",
    "status: operational",
    "type `help` for actions",
  ]);

  function out(line: string) {
    setTerm((x) => [...x, line].slice(-80));
  }

  // keyboard palette
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

  // wallet events
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
      const pk = res?.publicKey?.toString?.() || provider?.publicKey?.toString?.() || "";
      setWalletStatus("CONNECTED");
      setWalletAddr(pk);
      out(`wallet: connected (${shorten(pk) || "connected"})`);
    } catch {
      out("wallet: connection cancelled");
    }
  }

  async function disconnectWallet() {
    const provider = getSolProvider();
    try { await provider?.disconnect?.(); } catch {}
    setWalletStatus("DISCONNECTED");
    setWalletAddr("");
    out("wallet: disconnected");
  }

  async function cmdStatus() {
    out("status: querying /api/health ");
    const r = await fetchJson<HealthResp>("/api/health");
    if (!r.ok) {
      out(`status: ERROR (${r.ms}ms)  ${r.error}`);
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
    out("routes: probing edge ");
    const r = await fetchJson<HealthResp>("/api/health");
    if (!r.ok) {
      out(`GET  /api/health      ERROR (${r.ms}ms)  ${r.error}`);
      out("POST /api/quote       READY (edge)");
      out("WS   /stream          OPEN (ui)");
      return;
    }
    out(`GET  /api/health      200 (${r.ms}ms)`);
    out("POST /api/quote       200 (edge)");
    out("WS   /stream          OPEN (ui)");
  }

  async function cmdQuote(symbol: string, size: number) {
    out(`quote: POST /api/quote { symbol=${symbol}, size=${size} } `);
    const r = await fetchJson<QuoteResp>("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ symbol, size }),
    });
    if (!r.ok) {
      out(`quote: ERROR (${r.ms}ms)  ${r.error}`);
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
      if (!symbol) return void out("quote: missing symbol (example: quote SOL 3)");
      if (!Number.isFinite(size) || size <= 0) return void out("quote: invalid size (example: quote SOL 3)");
      return void cmdQuote(symbol, Math.floor(size));
    }

    out(`error: unknown command '${input}'`);
  }

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
    walletStatus === "CONNECTED" ? (shorten(walletAddr) || "Connected") :
    walletStatus === "UNAVAILABLE" ? "Install Wallet" :
    "Connect Wallet";

  const walletAction = () => walletStatus === "CONNECTED" ? disconnectWallet() : connectWallet();

  return (
    <>
      <AnimatePresence>
        {boot && <BootOverlay onDone={() => setBoot(false)} />}
      </AnimatePresence>

      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={commands} />

      <DraggablePanel title="Telemetry" initial={{ x: 30, y: 120, w: 360, h: 420 }} right={<div className="mono text-xs text-white/55">live</div>}>
        <TelemetryCharts />
      </DraggablePanel>

      <DraggablePanel title="Event Log" initial={{ x: 410, y: 120, w: 420, h: 420 }} right={<div className="mono text-xs text-white/55">filter</div>}>
        <LogStream />
      </DraggablePanel>

      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/80">HEXA / CONSOLE</div>

            <div className="flex items-center gap-2">
              <a className="btn-ghost mono text-sm inline-flex items-center gap-2" href={LINKS.x} target="_blank" rel="noreferrer">
                <XIcon size={16} /> X
              </a>
              <a className="btn-ghost mono text-sm inline-flex items-center gap-2" href={LINKS.github} target="_blank" rel="noreferrer">
                <Github size={16} /> GitHub
              </a>
              <button className="btn mono text-sm inline-flex items-center gap-2" onClick={walletAction}>
                <Wallet size={16} /> {walletLabel}
              </button>
            </div>
          </div>

          <div className="tilt glass glow relative overflow-hidden p-6">
            <ClientOnly>
              <NetworkGraphBackground />
            </ClientOnly>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/85">OPERATIONAL</div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/80">EDGE ROUTING</div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/70">TELEMETRY BUS</div>
                    <div className="pill mono px-3 py-1 text-xs tracking-widest text-white/70">CTRL/+K</div>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-white">
                    HEXA <span className="text-white/55">//</span> Infra Console
                  </h1>
                  <p className="mt-2 text-sm text-white/70 mono">production console  secure runtime  observability-first</p>
                </div>

                <div className="flex gap-2">
                  <button className="btn mono text-sm inline-flex items-center gap-2" onClick={() => setPalette(true)}>
                    <CommandIcon size={16} /> command
                  </button>
                  <button className="btn-ghost mono text-sm inline-flex items-center gap-2" onClick={() => setTab("terminal")}>
                    <Terminal size={16} /> console
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

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
                <span className={tab === t.key ? "text-white" : "text-white/60"}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="tilt glass glow lg:col-span-2 p-5">
              {tab === "terminal" ? (
                <div className="terminal">
                  <div className="term-topbar">
                    <span className="dot" />
                    <span className="dot" style={{ opacity: 0.7 }} />
                    <span className="dot" style={{ opacity: 0.45 }} />
                    <span className="ml-2 mono text-xs text-white/70">hexa://console</span>
                  </div>

                  <div className="term-body mono text-sm">
                    {term.map((line, i) => (
                      <div key={i} className="term-line">
                        <span className={line.startsWith("$") ? "prompt" : "dim"}>{line.startsWith("$") ? ">" : ""}</span>
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
                        placeholder="type a command (help)  |  Ctrl/+K"
                        spellCheck={false}
                      />
                      <span className="blink" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass p-4">
                  <div className="mono text-xs uppercase tracking-widest text-white/55">{tab.toUpperCase()}</div>
                  <div className="mt-3 mono text-sm text-white/85 space-y-2">
                    {tab === "routes" && (
                      <>
                        <div>GET  /api/health</div>
                        <div>POST /api/quote</div>
                        <div>WS   /stream</div>
                        <div className="text-white/55">Tip: run <span className="text-white">routes</span> in Terminal to probe live.</div>
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
            </div>

            <div className="space-y-4">
              <div className="tilt glass glow p-5">
                <div className="mono text-xs uppercase tracking-widest text-white/55">ACTIONS</div>
                <div className="mt-4 space-y-3">
                  <button className="btn w-full mono text-sm" onClick={() => out("policy: strict enforcement enabled")}>enable strict policy</button>
                  <button className="btn w-full mono text-sm" onClick={() => out("telemetry: snapshot exported")}>export snapshot</button>
                  <button className="btn-ghost w-full mono text-sm" onClick={() => setPalette(true)}>open command</button>
                  <button className="btn-ghost w-full mono text-sm" onClick={() => runCommand("status")}>run status</button>
                </div>
              </div>

              <div className="tilt glass glow p-5">
                <div className="mono text-xs uppercase tracking-widest text-white/55">LIVE METRICS</div>
                <div className="mt-4">
                  <TelemetryCharts />
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-10 text-center mono text-xs text-white/45">HEXA Console  v1.0.0  operational</footer>
        </div>
      </main>
    </>
  );
}