"use client";
import React from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

export default function DraggablePanel({
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
  return (
    <motion.div
      className="fixed z-[60]"
      style={{ width: initial.w, height: initial.h, left: 0, top: 0 }}
      drag
      dragMomentum={false}
      dragElastic={0.08}
      initial={{ x: initial.x, y: initial.y }}
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