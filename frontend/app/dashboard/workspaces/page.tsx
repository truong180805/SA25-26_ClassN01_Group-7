"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { Briefcase, ExternalLink, Trash2, Globe, Clock, Layers } from "lucide-react";

// Định nghĩa cấu trúc dữ liệu chuẩn mã nguồn
interface WorkspaceTab {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
}

interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  tabs: WorkspaceTab[];
}

export default function WorkspacesPage() {
  const { token } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. LẤY USER ID TỪ TOKEN VÀ GỌI API LẤY DANH SÁCH WORKSPACE
    const fetchWorkspaces = async () => {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded.userId;

      const res = await fetch(`http://localhost:5000/api/workspaces/user/${userId}`);
      if (res.ok) {
        // Đã sửa lỗi ở đây: chỉ gọi res.json()
        const result = await res.json();
        setWorkspaces(result);
      } else {
        setError("Không thể tải danh sách không gian làm việc.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối tới máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [token]);

  // 2. TÍNH NĂNG THẦN TỐC: BẤM MỘT PHÁT BUNG TOÀN BỘ TAB TRÌNH DUYỆT
  const handleOpenWorkspace = (tabs: WorkspaceTab[]) => {
    if (tabs.length === 0) {
      alert("Không gian này chưa có tab nào được lưu!");
      return;
    }
    
    // Duyệt qua mảng và kích hoạt mở tab mới trên trình duyệt
    tabs.forEach((tab) => {     
        window.open(tab.url, "_blank");
    });
  };

  // 3. XÓA WORKSPACE KHÔNG CÒN SỬ DỤNG
  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Không gian làm việc này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/workspaces/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Cập nhật lại State để giao diện biến mất ngay lập tức không cần f5
        setWorkspaces(workspaces.filter((w) => w.id !== id));
      } else {
        alert("Xóa thất bại!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10">
      {/* HEADER CỦA TRANG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <Layers className="mr-3 text-blue-600 animate-pulse" size={32} />
            Không gian làm việc
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Quản lý các bộ Tab trình duyệt được lưu từ Chrome Extension của bạn.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium mb-6">
          {error}
        </div>
      )}

      {/* NẾU CHƯA CÓ WORKSPACE NÀO ĐƯỢC LƯU */}
      {workspaces.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có Không gian nào</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Hãy mở các tab tài liệu học tập/làm việc trên Chrome, bật Extension lên và bấm nút Lưu để tạo Không gian đầu tiên nhé!
          </p>
        </div>
      ) : (
        /* DANH SÁCH CÁC TẤM THẺ WORKSPACE GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div 
              key={ws.id} 
              className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-50/50 hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Phần đầu của thẻ */}
              <div className="p-6 border-b border-gray-50 flex items-start justify-between bg-gradient-to-b from-gray-50/50 to-white">
                <div className="flex items-center space-x-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ backgroundColor: ws.color || "#3b82f6" }}
                  >
                    <Briefcase size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-base truncate group-hover:text-blue-600 transition-colors">
                      {ws.name}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center mt-0.5">
                      <Clock size={12} className="mr-1" />
                      {new Date(ws.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteWorkspace(ws.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Xóa Không gian"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Danh sách các link thu gọn bên trong Thẻ */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                    Danh sách các trang ({ws.tabs.length})
                  </span>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {ws.tabs.map((tab) => (
                      <a 
                        key={tab.id}
                        href={tab.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-gray-600 hover:text-blue-600 transition-colors py-1 group/link"
                      >
                        {tab.favicon ? (
                          <img src={tab.favicon} className="w-3.5 h-3.5 rounded mr-2 shrink-0" alt="" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
                        ) : (
                          <Globe size={14} className="text-gray-400 mr-2 shrink-0" />
                        )}
                        <span className="truncate flex-1 font-medium">{tab.title}</span>
                        <ExternalLink size={12} className="text-gray-300 opacity-0 group-hover/link:opacity-100 transition-opacity ml-1 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* NÚT KÍCH HOẠT QUAN TRỌNG NHẤT */}
                <button 
                  onClick={() => handleOpenWorkspace(ws.tabs)}
                  className="w-full mt-6 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white border border-gray-100 font-bold text-xs py-3 px-4 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>KÍCH HOẠT KHÔNG GIAN</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}