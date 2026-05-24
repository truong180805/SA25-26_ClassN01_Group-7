"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  // Vì params trong Next.js 15+ là một Promise, ta dùng hook use() để giải nén
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu nhập lại không khớp!" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Đặt lại mật khẩu thành công!" });
        // Tự động chuyển hướng về đăng nhập sau 2 giây
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Token không hợp lệ hoặc đã hết hạn." });
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
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
            <Lock size={24} />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2">Mật khẩu mới</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn. Nên sử dụng mật khẩu mạnh có cả chữ và số.
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
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || message?.type === "success"}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center mt-2"
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu mật khẩu mới"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-green-600 transition-colors">
              Hủy và quay lại Đăng nhập <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}