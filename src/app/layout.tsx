import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlowSchedule",
    template: "%s | FlowSchedule",
  },
  description:
    "Effortlessly manage your time and boost productivity with FlowSchedule. A clean, intuitive interface combines a dynamic weekly calendar, AI-powered insights, and smart features to help you stay organized and focused.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
