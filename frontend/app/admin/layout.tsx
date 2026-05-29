"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { ShieldAlert, ArrowLeft, ShieldCheck, Users, Activity, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Lỗi giải mã token", error);
      }
    }
    setLoading(false);
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  // KHIÊN CHẶN NGƯỜI DÙNG THƯỜNG
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm"><ShieldAlert size={48} /></div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Truy cập bị từ chối</h1>
        <p className="text-gray-500 mb-8 font-medium">Khu vực này được bảo mật nghiêm ngặt dành riêng cho Quản trị viên.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md">
          Quay lại hệ thống
        </button>
      </div>
    );
  }

  // GIAO DIỆN CHUYÊN BIỆT CHO ADMIN
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* SIDEBAR TỐI MÀU (DARK THEME) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <ShieldCheck className="text-blue-500 mr-3" size={24} />
          <span className="font-black text-lg tracking-wider">OMNIDASH<span className="text-blue-500">_OS</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className={`px-4 py-3 rounded-xl flex items-center font-bold transition-all ${pathname === '/admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Activity size={18} className="mr-3" /> Tổng quan
          </Link>
          <Link href="/admin/users" className={`px-4 py-3 rounded-xl flex items-center font-bold transition-all ${pathname === '/admin/users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Users size={18} className="mr-3" /> Người dùng
          </Link>
          <Link href="/admin/system" className={`px-4 py-3 rounded-xl flex items-center font-bold transition-all ${pathname === '/admin/system' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Settings size={18} className="mr-3" /> Bảo trì Hệ thống
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-bold text-sm">
            <ArrowLeft size={18} className="mr-3" /> Quay lại App User
          </Link>
          <button 
            onClick={() => { logout(); router.push('/login'); }} 
            className="w-full flex items-center px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors font-bold text-sm"
          >
            <LogOut size={18} className="mr-3" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="font-black text-gray-800 uppercase tracking-widest text-sm">Bảng điều khiển Quản trị</h2>
          <div className="flex items-center space-x-3 bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold text-xs border border-red-100">
            <span>Admin</span>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}