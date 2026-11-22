import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salary Management Platform",
  description:
    "Salary Management PlatformA centralized platform for HR managers to manage employee salary information and understand how the organization pays people",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {" "}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
