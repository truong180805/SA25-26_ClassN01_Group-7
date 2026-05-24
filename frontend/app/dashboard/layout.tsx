"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Briefcase, CheckSquare, FileText, 
  Settings, LogOut, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); 
  const { logout } = useAuthStore();
  const router = useRouter();
  
  // State điều khiển việc thu gọn Sidebar theo yêu cầu của bạn
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Danh sách các menu chính
  const menuItems = [
    { name: "Tổng quan", path: "/dashboard", icon: LayoutDashboard },
    { name: "Workspaces", path: "/dashboard/workspaces", icon: Briefcase },
    { name: "Tác vụ (Tasks)", path: "/dashboard/projects", icon: CheckSquare }, 
    { name: "Ghi chú (Notes)", path: "/dashboard/notes", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      
      {/* SIDEBAR BÊN TRÁI - Thay đổi kích thước (width) động dựa vào trạng thái isCollapsed */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 hidden md:flex transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}>
        
        {/* HEADER SIDEBAR (LOGO + NÚT THU GỌN) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
              <span className="text-white font-black text-xl leading-none">O</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-black tracking-tight text-gray-900 ml-3 animate-in fade-in duration-200 truncate">
                OmniDash
              </span>
            )}
          </div>
          
          {/* Nút bấm để thu gọn / mở rộng Sidebar */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors ml-1 shrink-0"
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* DANH SÁCH MENU ĐIỀU HƯỚNG */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          {!isCollapsed && (
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-3 animate-in fade-in duration-200">
              Menu chính
            </p>
          )}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path; 
              
              return (
                <Link key={item.name} href={item.path}>
                  <div 
                    className={`flex items-center py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                      isCollapsed ? "justify-center px-0" : "px-4"
                    } ${
                      isActive 
                        ? "bg-blue-50 text-blue-700 border border-blue-100/50 shadow-sm" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <Icon size={18} className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {!isCollapsed && <span className="animate-in fade-in duration-200">{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* MENU PHÍA DƯỚI (CÀI ĐẶT & ĐĂNG XUẤT) */}
        <div className="p-3 border-t border-gray-100 space-y-1.5 shrink-0">
          
          {/* ĐÃ NÂNG CẤP: Bọc Link liên kết và xử lý trạng thái Active cho Cài đặt */}
          <Link href="/dashboard/settings">
            <div 
              className={`flex items-center py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isCollapsed ? "justify-center px-0" : "px-4"
              } ${
                pathname === "/dashboard/settings"
                  ? "bg-blue-50 text-blue-700 border border-blue-100/50 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
              }`}
              title={isCollapsed ? "Cài đặt tài khoản" : ""}
            >
              <Settings size={18} className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${pathname === "/dashboard/settings" ? "text-blue-600" : "text-gray-400"}`} />
              {!isCollapsed && <span className="animate-in fade-in duration-200">Cài đặt</span>}
            </div>
          </Link>

          <div 
            onClick={handleLogout} 
            className={`flex items-center py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
            title={isCollapsed ? "Đăng xuất tài khoản" : ""}
          >
            <LogOut size={18} className={isCollapsed ? 'mr-0' : 'mr-3'} />
            {!isCollapsed && <span className="animate-in fade-in duration-200">Đăng xuất</span>}
          </div>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar chung */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-3 bg-gray-50 py-1.5 px-2 rounded-full border border-gray-100">
            <span className="text-xs font-bold text-gray-600 pl-3">Tài khoản User</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-inner">
              U
            </div>
          </div>
        </header>

        {/* Khu vực kết xuất nội dung các trang con */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          {children} 
        </main>
      </div>
    </div>
  );
}