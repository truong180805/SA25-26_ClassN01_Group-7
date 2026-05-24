// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore"; // Lấy Store quản lý Token

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken); // Gọi hàm lưu token từ Zustand

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Đăng nhập thất bại.");
        return;
      }

      // Lưu Token vào Zustand (Zustand sẽ tự lưu vào localStorage)
      setToken(data.token);
      
      // Chuyển hướng thẳng vào trang Dashboard
      router.push("/dashboard");

    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Đăng Nhập OmniDash</h2>

        {error && <p className="mb-4 text-sm text-center text-red-500">{error}</p>}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-bold text-gray-700">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
          Đăng Nhập
        </button>
        <Link href="/forgot-password" className="text-blue-500 hover:underline">
        Quên mật khẩu?
        </Link>
        {/* ĐÂY LÀ ĐOẠN LINK MỚI THÊM VÀO */}
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Chưa có tài khoản? </span>
          <Link href="/register" className="text-blue-500 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}