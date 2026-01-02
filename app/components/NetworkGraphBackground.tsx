"use client";
import React, { useEffect, useRef } from "react";

export default function NetworkGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext("2d");
    const ctx = ctxRef.current;
    if (!ctx) return;

    let raf = 0;
    let w = 0,
      h = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      const c = canvasRef.current;
      const cx = ctxRef.current;
      if (!c || !cx) return;

      w = c.clientWidth;
      h = c.clientHeight;

      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);

      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    const N = 76;
    const pts = Array.from({ length: N }).map(() => ({
      x: Math.random() * 1200,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 1.6,
    }));

    function step() {
      raf = requestAnimationFrame(step);
      const cx = ctxRef.current;
      if (!cx) return;

      cx.clearRect(0, 0, w, h);

      cx.fillStyle = "rgba(0,0,0,0.26)";
      cx.fillRect(0, 0, w, h);

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
            cx.strokeStyle = `rgba(255, 0, 80, ${alpha})`;
            cx.lineWidth = 1;
            cx.beginPath();
            cx.moveTo(a.x, a.y);
            cx.lineTo(b.x, b.y);
            cx.stroke();
          }
        }
      }

      for (const p of pts) {
        cx.fillStyle = "rgba(255,0,80,0.72)";
        cx.beginPath();
        cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        cx.fill();

        cx.fillStyle = "rgba(255,0,80,0.12)";
        cx.beginPath();
        cx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        cx.fill();
      }
    }

    step();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctxRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-[18px]">
      <canvas ref={canvasRef} className="h-full w-full opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,80,0.18),transparent_60%),radial-gradient(circle_at_70%_30%,rgba(255,0,80,0.10),transparent_55%)]" />
    </div>
  );
}
