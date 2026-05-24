"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Đăng ký thất bại. Vui lòng thử lại.");
        return;
      }

      if (response.ok) {
        alert("Đăng ký thành công! Đang chuyển hướng đến trang Đăng nhập...");
        router.push("/login"); // Tự động nhảy sang trang Login
      }

      setSuccessMsg("Đăng ký thành công! Bạn có thể chuyển sang trang đăng nhập.");
      setFullName("");
      setEmail("");
      setPassword("");

    } catch (err) {
      setError("Không thể kết nối đến máy chủ Backend.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form 
        onSubmit={handleRegister} 
        className="w-full max-w-md p-8 bg-white rounded-lg shadow-md"
      >
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Tạo Tài Khoản
        </h2>

        {error && <p className="mb-4 text-sm text-center text-red-500">{error}</p>}
        {successMsg && <p className="mb-4 text-sm text-center text-green-500">{successMsg}</p>}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700">Họ và Tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            placeholder="Ví dụ: Nguyễn Văn A"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            placeholder="Ví dụ: email@gmail.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-bold text-gray-700">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-3 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            placeholder="********"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
        >
          Đăng Ký
        </button>

        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Đã có tài khoản? </span>
          <Link href="/login" className="text-blue-500 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}