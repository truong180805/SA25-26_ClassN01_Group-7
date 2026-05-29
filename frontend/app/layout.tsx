import type { Metadata } from "next";
import { Nunito } from "next/font/google"; // Nhập font Nunito
import "./globals.css";

// Cấu hình font Nunito
const nunito = Nunito({ 
  subsets: ["latin", "vietnamese"], // Hỗ trợ tiếng Việt
  weight: ["400", "500", "600", "700", "800", "900"], 
});

export const metadata: Metadata = {
  title: "OmniDash Workspace",
  description: "Hệ thống quản lý công việc toàn diện",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/* Áp dụng font Nunito cho toàn bộ body */}
      <body className={`${nunito.className} antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}