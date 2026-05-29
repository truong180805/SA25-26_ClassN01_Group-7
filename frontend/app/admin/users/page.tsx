"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { UserCog, Trash2, Search, ShieldAlert, CheckCircle2 } from "lucide-react";

interface UserData {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Gọi API lấy toàn bộ danh sách User
  useEffect(() => {
    if (!token) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setUsers(await res.json());
        }
      } catch (error) {
        console.error("Lỗi tải danh sách người dùng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  // Xử lý Xóa người dùng
  const handleDeleteUser = async (userId: string) => {
    const isConfirm = window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tài khoản và TOÀN BỘ Workspace, Dự án, Ghi chú của họ. Bạn chắc chắn chứ?");
    if (!isConfirm) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Cập nhật lại UI sau khi xóa thành công
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi xóa.");
      }
    } catch (error) {
      console.error("Lỗi xóa user:", error);
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  // Logic Tìm kiếm (Lọc theo Tên hoặc Email)
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const nameMatch = user.fullName?.toLowerCase().includes(search) || false;
    const emailMatch = user.email.toLowerCase().includes(search);
    return nameMatch || emailMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-slate-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center">
            <UserCog size={24} className="mr-3 text-blue-600"/> 
            Quản lý Tài khoản
          </h2>
          <p className="text-sm text-slate-500 font-bold mt-1">
            Tổng số: <span className="text-blue-600">{users.length}</span> người dùng trên hệ thống
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* BẢNG DANH SÁCH NGƯỜI DÙNG */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Tài khoản & Liên hệ</th>
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Ngày tham gia</th>
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-slate-400 font-bold">Không tìm thấy người dùng nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6 flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-black flex items-center justify-center mr-4 uppercase shrink-0">
                        {(user.fullName || user.email).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {user.fullName || "Người dùng ẩn danh"}
                        </div>
                        <div className="text-xs font-medium text-slate-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                        user.role === 'ADMIN' 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.role === 'ADMIN' && <ShieldAlert size={12} className="mr-1.5" />}
                        {user.role === 'USER' && <CheckCircle2 size={12} className="mr-1.5" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {user.role !== 'ADMIN' ? (
                        <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
                          Không thể xóa
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}