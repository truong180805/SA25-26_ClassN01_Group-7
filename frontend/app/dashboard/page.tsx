"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
// Import bộ Icon từ lucide-react
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  StickyNote, 
  Settings, 
  LifeBuoy, 
  LogOut 
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string;
  modeType: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  // --- STATE ĐIỀU HƯỚNG MENU ---
  const [activeTab, setActiveTab] = useState("overview");

  // --- STATE DỮ LIỆU ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");

  // Tránh lỗi Hydration của Next.js
  useEffect(() => { setIsMounted(true); }, []);

  // Lấy dữ liệu Workspace khi khởi động
  useEffect(() => {
    if (!isMounted) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const decodedToken: any = jwtDecode(token);
        const currentUserId = decodedToken.userId;
        setUserId(currentUserId);

        const response = await fetch(`http://localhost:5000/api/workspaces/${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [token, router, isMounted]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!isMounted || !token) return null;

  // --- CẤU HÌNH MENU SIDEBAR ---
  const menuItems = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "workspaces", label: "Workspaces", icon: Briefcase },
    { id: "tasks", label: "Tác vụ (Tasks)", icon: CheckSquare },
    { id: "notes", label: "Ghi chú (Notes)", icon: StickyNote },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Cài đặt", icon: Settings },
    { id: "support", label: "Hỗ trợ", icon: LifeBuoy },
  ];

  // --- HÀM RENDER NỘI DUNG BÊN PHẢI DỰA TRÊN TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Chào mừng bạn trở lại!</h2>
            
            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white border rounded-xl shadow-sm border-l-4 border-l-blue-500">
                <p className="text-sm text-gray-500">Workspaces</p>
                <p className="text-3xl font-bold text-gray-800">{workspaces.length}</p>
              </div>
              <div className="p-6 bg-white border rounded-xl shadow-sm border-l-4 border-l-green-500">
                <p className="text-sm text-gray-500">Tác vụ cần làm</p>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="p-6 bg-white border rounded-xl shadow-sm border-l-4 border-l-yellow-500">
                <p className="text-sm text-gray-500">Ghi chú nhắc nhở</p>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Các Không gian làm việc gần đây</h3>
            {isLoading ? (
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            ) : workspaces.length === 0 ? (
              <p className="text-gray-500 italic">Chưa có dữ liệu Workspace.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.slice(0, 3).map((ws) => (
                  <div key={ws.id} className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer">
                    <h4 className="font-bold text-gray-800">{ws.name}</h4>
                    <p className="text-gray-500 text-sm mt-1 truncate">{ws.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "workspaces":
        return <div><h2 className="text-2xl font-bold text-gray-800">Quản lý Workspaces</h2><p className="text-gray-500 mt-2">Tính năng thêm, sửa, xóa Workspace sẽ được đặt tại đây.</p></div>;
      case "tasks":
        return <div><h2 className="text-2xl font-bold text-gray-800">Quản lý Tác vụ</h2><p className="text-gray-500 mt-2">Giao diện Kanban/Danh sách task và sub-task sẽ hiển thị ở đây.</p></div>;
      case "notes":
        return <div><h2 className="text-2xl font-bold text-gray-800">Ghi chú & Nhắc nhở</h2><p className="text-gray-500 mt-2">Trang ghi chú Markdown sẽ hiển thị ở đây.</p></div>;
      case "settings":
        return <div><h2 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h2></div>;
      case "support":
        return <div><h2 className="text-2xl font-bold text-gray-800">Hỗ trợ</h2><p className="text-gray-500 mt-2">Gửi phản hồi cho nhà phát triển.</p></div>;
      default:
        return <div>Nội dung đang phát triển...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* --- CỘT SIDEBAR ĐIỀU HƯỚNG --- */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">OmniDash</h2>
          </div>

          {/* Menu chính */}
          <nav className="p-4 space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu chính</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Menu phụ & Đăng xuất (Nằm dưới cùng) */}
        <div className="p-4 border-t space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 text-gray-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 mt-2 rounded-lg transition-all text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* --- KHU VỰC NỘI DUNG CHÍNH --- */}
      <main className="flex-1 overflow-y-auto">
        {/* Thanh Header nhỏ bên trên */}
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800 capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Tài khoản User</span>
            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border border-blue-200">
              U
            </div>
          </div>
        </header>

        {/* Nội dung thay đổi theo Tab */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}