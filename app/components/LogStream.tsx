"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Pause, Play, Filter, Search } from "lucide-react";

type Level = "INFO" | "WARN" | "ERROR";
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

export default function LogStream() {
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Log[]>(() => Array.from({ length: 16 }).map(() => randomLog()));

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setItems(prev => [...prev.slice(-39), randomLog()]), 950);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(x => {
      if (level !== "ALL" && x.level !== level) return false;
      if (s && !`${x.level} ${x.msg}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items, level, q]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="mono text-xs uppercase tracking-widest text-white/55">EVENT LOG</div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost mono text-xs" onClick={() => setPaused(p => !p)}>
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
        {(["ALL", "INFO", "WARN", "ERROR"] as const).map(k => (
          <button
            key={k}
            className={[
              "mono rounded-xl border px-3 py-2 text-xs transition",
              level === k ? "border-white/22 bg-white/10 text-white" : "border-white/10 bg-black/30 text-white/70 hover:bg-white/6",
            ].join(" ")}
            onClick={() => setLevel(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Search size={16} className="text-white/60" />
        <input className="input mono text-sm" placeholder="search events" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-white/10 bg-black/30">
        {filtered.map(x => (
          <div key={x.id} className="flex gap-3 px-3 py-2 border-b border-white/5 last:border-b-0">
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