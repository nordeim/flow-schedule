"use client";

// FlowSchedule — animated background blobs.
// Mirrors the reference's framer-motion decorative layer: three gradient
// circles drifting on mirrored loops (30s/35s/40s) inside a fixed
// pointer-events-none overlay.
//
// BL-1 (session 19, measured live): the reference's SECOND blob ships
// `w-100 h-100` — classes its Tailwind v3-scale build NEVER GENERATES
// (its 863KB stylesheet has `.w-96{width:24rem}` but NO `.w-100` rule),
// so the absolutely-positioned, content-less div collapses to 0×0 and
// never paints — the indigo/purple 35s blob is INVISIBLE on the
// reference (rect 0×0, measured). The clone mirrors the RENDERED
// effect (this blob carries NO width/height utilities and collapses
// the same way). The class string is deliberately NOT copied: this
// repo's Tailwind v4 dynamic-spacing scale WOULD generate `w-100` as
// 400px and keep the divergence. The icon_sm dead-variant ruling
// (session 6, P-7), applied to the blob layer. The animate keyframes
// and transition stay byte-identical to the decompiled reference —
// a 0×0 box animating is its own rendered behavior.

import { motion } from "framer-motion";

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-90" aria-hidden="true">
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-sky-400/40 to-blue-500/40 rounded-full blur-3xl"
        animate={{ x: [100, 400, 100], y: [150, 450, 150], scale: [0.9, 1.3, 0.9] }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      {/* BL-1: no width/height utilities — 0×0, mirroring the reference's
          dead w-100 h-100 (see the module comment). */}
      <motion.div
        className="absolute bg-gradient-to-r from-indigo-400/35 to-purple-500/35 rounded-full blur-3xl"
        animate={{ x: [500, 900, 500], y: [100, 400, 100], scale: [1.2, 0.8, 1.2] }}
        transition={{ duration: 35, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className="absolute w-80 h-80 bg-gradient-to-r from-cyan-400/45 to-teal-400/45 rounded-full blur-2xl"
        animate={{ x: [150, 550, 150], y: [450, 250, 450], scale: [1, 1.4, 1] }}
        transition={{ duration: 40, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 10 }}
      />
    </div>
  );
}
