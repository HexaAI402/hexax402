"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";

type TelemetryPoint = { t: string; latency: number; throughput: number; cpu: number };

function makePoint(i: number): TelemetryPoint {
  const base = Date.now();
  const t = new Date(base - (30 - i) * 1000);
  const label = t.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });

  const latency = 10 + Math.round(8 + 7 * Math.sin(base / 1400 + i / 3) + Math.random() * 4);
  const throughput = 180 + Math.round(40 * Math.sin(base / 1700 + i / 4) + Math.random() * 25);
  const cpu = 15 + Math.round(12 * Math.sin(base / 2200 + i / 5) + Math.random() * 8);

  return { t: label, latency, throughput, cpu };
}

export default function TelemetryCharts() {
  const seed = useMemo(() => Array.from({ length: 30 }).map((_, i) => makePoint(i)), []);
  const [data, setData] = useState<TelemetryPoint[]>(seed);

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const next = prev.slice(1);
        next.push(makePoint(29));
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const tooltipStyle = {
    background: "rgba(0,0,0,0.9)",
    border: "1px solid rgba(255,255,255,0.10)",
  } as const;

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
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.75)" }} />
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.75)" }} />
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.75)" }} />
              <Line type="monotone" dataKey="cpu" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}