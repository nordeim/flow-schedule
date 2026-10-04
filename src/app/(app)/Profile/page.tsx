"use client";

// /Profile — mirrors the reference: centered card with user glyph, three
// static preference cards (Settings / Notifications / Privacy).

import { Bell, Settings as SettingsIcon, Shield, User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center">
        <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile</h1>
        <p className="text-slate-600">Manage your account settings and preferences</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <SettingsIcon className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Settings</h3>
            <p className="text-sm text-slate-600">Configure your app preferences</p>
          </div>
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <Bell className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Notifications</h3>
            <p className="text-sm text-slate-600">Manage your notification settings</p>
          </div>
          <div className="p-6 bg-white/50 rounded-2xl border border-slate-200">
            <Shield className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Privacy</h3>
            <p className="text-sm text-slate-600">Control your privacy options</p>
          </div>
        </div>
      </div>
    </div>
  );
}
