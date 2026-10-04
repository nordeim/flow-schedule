"use client";

// FlowSchedule — animated background blobs.
// Mirrors the reference's framer-motion decorative layer: three gradient
// circles drifting on mirrored loops (30s/35s/40s) inside a fixed
// pointer-events-none overlay.

import { motion } from "framer-motion";

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-90" aria-hidden="true">
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-sky-400/40 to-blue-500/40 rounded-full blur-3xl"
        animate={{ x: [100, 400, 100], y: [150, 450, 150], scale: [0.9, 1.3, 0.9] }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-400/35 to-purple-500/35 rounded-full blur-3xl"
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
