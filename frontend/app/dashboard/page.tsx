"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, CheckSquare, FolderKanban, 
  FileText, Briefcase, TrendingUp, Clock, ArrowRight,
  Activity, CheckCircle2, Circle, Plus
} from "lucide-react";

interface DashboardData {
  stats: {
    projects: number;
    workspaces: number;
    notes: number;
    tasks: {
      total: number;
      completed: number;
      pending: number;
      completionRate: number;
    };
  };
  recentProjects: any[];
  recentNotes: any[];
}

export default function DashboardOverviewPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Bạn");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const decoded: any = jwtDecode(token);
        // Lấy tạm tên từ email (cắt phần trước @) nếu chưa có Tên đầy đủ
        setUserName(decoded.email?.split('@')[0] || "Bạn");

        const res = await fetch(`http://localhost:5000/api/dashboard/${decoded.userId}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10 animate-in fade-in duration-500">
      
      {/* LỜI CHÀO & HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <LayoutDashboard className="mr-3 text-blue-600" size={32} />
            Chào buổi sáng, {userName}! 👋
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Đây là tóm tắt toàn bộ hoạt động và tiến độ công việc của bạn trên OmniDash.
          </p>
        </div>
        <Link href="/dashboard/projects">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center">
            <Plus size={18} className="mr-2" /> Tạo việc mới
          </button>
        </Link>
      </div>

      {/* 4 THẺ THỐNG KÊ NHANH (STATS CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Dự án</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:text-blue-600 transition-colors">{data.stats.projects}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><FolderKanban size={26} /></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Công việc (Tasks)</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:text-green-600 transition-colors">{data.stats.tasks.total}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center"><CheckSquare size={26} /></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:text-yellow-500 transition-colors">{data.stats.notes}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center"><FileText size={26} /></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Không gian (WS)</p>
            <h3 className="text-3xl font-black text-gray-800 group-hover:text-purple-600 transition-colors">{data.stats.workspaces}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><Briefcase size={26} /></div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI (TIẾN ĐỘ TỔNG & DỰ ÁN GẦN ĐÂY) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* THANH TIẾN ĐỘ CHUNG (TASK COMPLETION) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Activity size={20} className="mr-2 text-blue-600" /> Tỷ lệ hoàn thành công việc
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Đã hoàn thành <span className="font-bold text-gray-700">{data.stats.tasks.completed}</span> / {data.stats.tasks.total} nhiệm vụ
                </p>
              </div>
              <div className="text-3xl font-black text-blue-600">{data.stats.tasks.completionRate}%</div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${data.stats.tasks.completionRate}%` }}
              ></div>
            </div>
            
            <div className="flex items-center space-x-6 mt-5 text-sm font-bold">
              <span className="flex items-center text-green-600"><CheckCircle2 size={16} className="mr-1.5"/> Xong: {data.stats.tasks.completed}</span>
              <span className="flex items-center text-gray-400"><Circle size={16} className="mr-1.5"/> Đang chờ: {data.stats.tasks.pending}</span>
            </div>
          </div>

          {/* DỰ ÁN HOẠT ĐỘNG GẦN ĐÂY */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold text-gray-800 text-lg flex items-center">
                <Clock size={18} className="mr-2 text-gray-400" /> Dự án tương tác gần đây
              </h3>
              <Link href="/dashboard/projects" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center">
                Xem tất cả <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {data.recentProjects.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-sm text-gray-500 italic">Chưa có dự án nào.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recentProjects.map(proj => (
                  <Link href={`/dashboard/project/${proj.id}`} key={proj.id}>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-200 group">
                      <h4 className="font-bold text-gray-800 group-hover:text-blue-600 truncate mb-1">{proj.title}</h4>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mb-4">Có {proj._count.tasks} tác vụ con</p>
                      
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-gray-400">Tiến độ</span>
                        <span className={proj.progress === 100 ? 'text-green-600' : 'text-blue-600'}>{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${proj.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${proj.progress}%` }}></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (GHI CHÚ MỚI NHẤT & MẸO) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-800 flex items-center">
                <TrendingUp size={18} className="mr-2 text-yellow-500" /> Ghi chú mới nhất
              </h3>
              <Link href="/dashboard/notes" className="text-xs font-bold text-blue-600 hover:underline">Tất cả</Link>
            </div>

            {data.recentNotes.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Chưa có ghi chú nào.</p>
            ) : (
              <div className="space-y-3">
                {data.recentNotes.map(note => (
                  <Link href="/dashboard/notes" key={note.id}>
                    <div className="p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all flex items-start space-x-3 group cursor-pointer" style={{ backgroundColor: note.color ? `${note.color}15` : '#f8fafc' }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: note.color || '#cbd5e1' }}></div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 truncate">{note.title}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(note.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Khối mẹo nhỏ (Tips) */}
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-md">
            <h3 className="font-black text-lg mb-2">💡 Bạn có biết?</h3>
            <p className="text-sm text-blue-50 leading-relaxed mb-4">
              Cài đặt Extension OmniDash trên trình duyệt giúp bạn lưu lại mọi ý tưởng và các tab học tập chỉ bằng 1 cú click chuột!
            </p>
            <button className="bg-white text-blue-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full shadow-sm">
              Tải Extension ngay
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}