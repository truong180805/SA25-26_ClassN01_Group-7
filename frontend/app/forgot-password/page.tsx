"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Đã gửi email khôi phục!" });
        setEmail(""); // Xóa form
      } else {
        setMessage({ type: "error", text: data.error || "Có lỗi xảy ra." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Không thể kết nối đến máy chủ." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <Mail size={24} />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2">Quên mật khẩu?</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Đừng lo lắng! Hãy nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi cho bạn một đường dẫn để đặt lại mật khẩu mới.
          </p>

          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
            }`}>
              {message.type === "success" && <CheckCircle2 size={18} className="mr-2 shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="ví dụ: omnidash@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || message?.type === "success"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? "Đang gửi..." : (
                <>
                  <Send size={18} className="mr-2" /> Gửi link khôi phục
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}