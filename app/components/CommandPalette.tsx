"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command as CommandIcon, Search } from "lucide-react";

export type Cmd = { id: string; label: string; hint: string; action: () => void };

export default function CommandPalette({
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
    return commands.filter(c => c.label.toLowerCase().includes(s) || c.hint.toLowerCase().includes(s));
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
            <div className="glass glow p-4">
              <div className="flex items-center justify-between">
                <div className="pill mono inline-flex items-center gap-2 px-3 py-1 text-xs tracking-widest text-white/85">
                  <CommandIcon size={14} />
                  COMMAND
                </div>
                <div className="mono text-xs text-white/55">Ctrl/ + K</div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Search className="text-white/60" size={18} />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input mono text-sm"
                  placeholder="Search actions"
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
                    onClick={() => { c.action(); onClose(); }}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}