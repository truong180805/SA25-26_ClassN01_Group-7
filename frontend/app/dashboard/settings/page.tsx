"use client";

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { User, Lock, Save, ShieldCheck, Mail, Clock, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [userId, setUserId] = useState("");
  
  // State cho Profile
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // State cho Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Lấy dữ liệu User khi vào trang
  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      try {
        const decoded: any = jwtDecode(token);
        setUserId(decoded.userId);
        
        const res = await fetch(`http://localhost:5000/api/users/${decoded.userId}`);
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email);
          setFullName(data.fullName || "");
          setTimezone(data.timezone || "Asia/Ho_Chi_Minh");
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin user", err);
      }
    };
    fetchUser();
  }, [token]);

  // Xử lý lưu Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setMessage(null);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, timezone }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
      } else {
        setMessage({ type: "error", text: data.error || "Có lỗi xảy ra." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    setIsSavingPassword(true);
    setMessage(null);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Có lỗi xảy ra." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 flex items-center">
          <ShieldCheck className="mr-3 text-blue-600" size={32} />
          Cài đặt tài khoản
        </h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và bảo mật của bạn.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
        }`}>
          {message.type === "success" && <CheckCircle2 size={18} className="mr-2 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Menu Tab Trái */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-6 space-y-2">
          <button 
            onClick={() => { setActiveTab("profile"); setMessage(null); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-800 border border-transparent'}`}
          >
            <User size={18} className="mr-3" /> Thông tin chung
          </button>
          <button 
            onClick={() => { setActiveTab("security"); setMessage(null); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-800 border border-transparent'}`}
          >
            <Lock size={18} className="mr-3" /> Bảo mật
          </button>
        </div>

        {/* Nội dung Tab Phải */}
        <div className="flex-1 p-8">
          
          {/* TAB: HỒ SƠ */}
          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin chung</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Tài khoản Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" disabled value={email}
                      className="w-full bg-gray-100 border border-gray-200 pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Email được dùng để đăng nhập và không thể thay đổi.</p>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Họ và tên hiển thị</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập tên của bạn..."
                      className="w-full bg-white border border-gray-200 focus:border-blue-500 pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Múi giờ (Timezone)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      value={timezone} onChange={e => setTimezone(e.target.value)}
                      className="w-full bg-white border border-gray-200 focus:border-blue-500 pl-12 pr-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Asia/Ho_Chi_Minh">(GMT+07:00) Giờ Đông Dương - Hà Nội</option>
                      <option value="Asia/Tokyo">(GMT+09:00) Nhật Bản - Tokyo</option>
                      <option value="America/New_York">(GMT-05:00) Hoa Kỳ - New York</option>
                      <option value="Europe/London">(GMT+01:00) Anh - London</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-50 flex items-center">
                    {isSavingProfile ? "Đang lưu..." : <><Save size={18} className="mr-2" /> Lưu thông tin</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: BẢO MẬT */}
          {activeTab === "security" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h2>
              <form onSubmit={handleSavePassword} className="space-y-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Mật khẩu hiện tại</label>
                  <input 
                    type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu đang dùng..."
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 px-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Mật khẩu mới</label>
                    <input 
                      type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự..."
                      className="w-full bg-white border border-gray-200 focus:border-blue-500 px-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới..."
                      className="w-full bg-white border border-gray-200 focus:border-blue-500 px-4 py-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={isSavingPassword} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center">
                    {isSavingPassword ? "Đang xử lý..." : <><Lock size={18} className="mr-2" /> Đổi mật khẩu</>}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}