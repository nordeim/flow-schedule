"use client";

// /Settings — mirrors the reference: Theme swatches, Dark Mode, Language,
// Performance cards.

import { Globe, Moon, Palette, Zap } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
        <div className="space-y-6">
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Palette className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Theme</h3>
            </div>
            <p className="text-slate-600 mb-4">Customize the appearance of your app</p>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl cursor-pointer" />
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl cursor-pointer" />
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl cursor-pointer" />
            </div>
          </div>
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Moon className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold text-slate-900">Dark Mode</h3>
            </div>
            <p className="text-slate-600">Switch to dark theme for better night viewing</p>
          </div>
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-slate-900">Language</h3>
            </div>
            <p className="text-slate-600">Choose your preferred language</p>
          </div>
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-slate-900">Performance</h3>
            </div>
            <p className="text-slate-600">Optimize app performance settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
