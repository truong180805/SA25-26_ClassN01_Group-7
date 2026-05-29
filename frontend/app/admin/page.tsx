"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { 
  Users, Database, Folder, CheckSquare, FileText, 
  Activity, Server, Cpu, Clock, HardDrive 
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  totalNotes: number;
}

interface ServerHealth {
  memoryUsage: string;
  uptime: string;
  dbLatency: number;
}

export default function AdminOverview() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<ServerHealth>({ memoryUsage: "0", uptime: "0h 0m", dbLatency: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Lấy dữ liệu thống kê tĩnh (Chỉ gọi 1 lần khi load trang)
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats", { headers });
        if (res.ok) setStats(await res.json());
      } catch (error) {
        console.error("Lỗi tải thống kê bản ghi:", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Lấy dữ liệu phần cứng máy chủ (Cập nhật Real-time liên tục)
    const fetchHealth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/health", { headers });
        if (res.ok) setHealth(await res.json());
      } catch (error) {
        console.error("Lỗi cập nhật sức khỏe hệ thống:", error);
      }
    };

    fetchStats();
    fetchHealth();

    // 🚀 THIẾT LẬP REFRESH REAL-TIME: Cứ 3 giây quét phần cứng phần cứng 1 lần
    const interval = setInterval(fetchHealth, 3000);

    // Dọn dẹp bộ đếm khi người dùng chuyển sang trang khác để tránh tốn RAM trình duyệt
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-slate-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      
      {/* KHỐI 1: CHỈ SỐ CỐT LÕI (DỮ LIỆU ĐẾM TỪ DATABASE THẬT) */}
      <div>
        <h2 className="text-xs font-black text-slate-400 mb-4 flex items-center uppercase tracking-widest">
          <Activity size={16} className="mr-2 text-blue-500"/> Cơ sở dữ liệu ứng dụng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3"><Users size={24} /></div>
            <span className="text-3xl font-black text-slate-900">{stats?.totalUsers || 0}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Người dùng</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3"><Database size={24} /></div>
            <span className="text-3xl font-black text-slate-900">{stats?.totalWorkspaces || 0}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Workspaces</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3"><Folder size={24} /></div>
            <span className="text-3xl font-black text-slate-900">{stats?.totalProjects || 0}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Dự án</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-3"><CheckSquare size={24} /></div>
            <span className="text-3xl font-black text-slate-900">{stats?.totalTasks || 0}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Tác vụ</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center mb-3"><FileText size={24} /></div>
            <span className="text-3xl font-black text-slate-900">{stats?.totalNotes || 0}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Ghi chú</span>
          </div>

        </div>
      </div>

      {/* KHỐI 2: TRẠNG THÁI MÁY CHỦ THỰC TẾ (REAL-TIME HARDWARE METRICS) */}
      <div>
        <h2 className="text-xs font-black text-slate-400 mb-4 flex items-center uppercase tracking-widest">
          <Server size={16} className="mr-2 text-slate-500"/> Sức khỏe máy chủ & Phần cứng (Real-time)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ĐO % RAM THẬT CỦA MÁY TÍNH ĐANG CHẠY BACKEND */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Sử dụng RAM</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{health.memoryUsage}%</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Cpu size={22} /></div>
            </div>
            {/* Thanh tiến độ trực quan */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${health.memoryUsage}%` }}
              />
            </div>
          </div>

          {/* ĐO ĐỘ TRỄ PING ĐẾN DATABASE (MILI-GIÂY) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Phản hồi Database</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{health.dbLatency} <span className="text-xs text-slate-400 font-bold">ms</span></h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><HardDrive size={22} /></div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-6 flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 inline-block ${health.dbLatency < 50 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {health.dbLatency < 50 ? 'Kết nối cực kỳ ổn định' : 'Hệ thống phản hồi chậm'}
            </p>
          </div>

          {/* ĐO THỜI GIAN HOẠT ĐỘNG LIÊN TỤC CỦA MÁY TÍNH */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Thời gian hoạt động</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{health.uptime}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Clock size={22} /></div>
            </div>
            <p className="text-xs font-bold text-emerald-500 mt-6 uppercase tracking-widest">Hệ thống luôn sẵn sàng</p>
          </div>

        </div>
      </div>

    </div>
  );
}