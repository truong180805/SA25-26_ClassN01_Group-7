"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Bell, Plus, Trash2, Clock, Check, X 
} from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  icon: string;
  color: string;
  interval: number;
  isActive: boolean;
}

const ICONS = ["💧", "👁️", "🚶", "💊", "🧘", "🍎", "🔔", "☕"];
const COLORS = [
  { name: "Xanh dương", value: "#dbeafe" },
  { name: "Vàng", value: "#fef08a" },
  { name: "Xanh lá", value: "#bbf7d0" },
  { name: "Hồng", value: "#fbcfe8" },
  { name: "Cam", value: "#fed7aa" },
  { name: "Tím", value: "#e9d5ff" },
];

export default function RemindersPage() {
  const { token } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  // --- STATE MODAL & FORM ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [interval, setIntervalValue] = useState("30");
  const [selectedIcon, setSelectedIcon] = useState("💧");
  const [selectedColor, setSelectedColor] = useState("#dbeafe");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dùng cho nút xóa Inline Confirm (Xóa tại chỗ giống Extension)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setUserId(decoded.userId);
      fetchReminders(decoded.userId);
    }
  }, [token]);

  const fetchReminders = async (uId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reminders/user/${uId}`);
      if (res.ok) setReminders(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle(""); setIntervalValue("30");
    setSelectedIcon("💧"); setSelectedColor("#dbeafe");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !interval || !userId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`http://localhost:5000/api/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, interval, icon: selectedIcon, color: selectedColor })
      });
      if (res.ok) {
        fetchReminders(userId);
        closeModal();
      }
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Cập nhật UI trước cho mượt (Optimistic UI)
    setReminders(reminders.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
    try {
      await fetch(`http://localhost:5000/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
    } catch (err) { console.error(err); }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Tự động hủy trạng thái chờ xóa sau 3 giây
      setTimeout(() => setConfirmDeleteId(null), 3000);
    } else {
      // Bấm lần 2 -> Thực hiện xóa dữ liệu
      try {
        const res = await fetch(`http://localhost:5000/api/reminders/${id}`, { method: "DELETE" });
        if (res.ok) setReminders(reminders.filter(r => r.id !== id));
      } catch (err) { console.error(err); } 
      finally { setConfirmDeleteId(null); }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <Bell className="mr-3 text-blue-600" size={32} />
            Cấu hình Nhắc nhở
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Đồng bộ thời gian thực với Extension để bảo vệ sức khỏe khi làm việc.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center transition-colors"
        >
          <Plus size={18} className="mr-2" /> Thêm nhắc nhở mới
        </button>
      </div>

      {/* DANH SÁCH LƯỚI CARDS NHẮC NHỞ */}
      {reminders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Bell size={32} /></div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có nhắc nhở nào</h3>
          <p className="text-sm text-gray-400 mt-2">Bấm nút ở góc trên để tạo lịch nhắc nhở uống nước hoặc nghỉ mắt nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((rem) => (
            <div 
              key={rem.id} 
              className="border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between bg-white group relative"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0"
                  style={{ backgroundColor: rem.color }}
                >
                  {rem.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-base truncate pr-4">{rem.title}</h3>
                  <span className="text-xs text-gray-400 font-bold flex items-center mt-1 uppercase tracking-wide">
                    <Clock size={12} className="mr-1.5 text-gray-400" /> Mỗi {rem.interval} phút
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {/* CÔNG TẮC TOGGLE SWITCH */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" className="sr-only peer" 
                    checked={rem.isActive} onChange={() => handleToggleActive(rem.id, rem.isActive)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>

                {/* NÚT XÓA INLINE CONFIRM */}
                <button 
                  onClick={() => handleDeleteClick(rem.id)}
                  className={`p-2 rounded-xl text-sm font-bold transition-all ${
                    confirmDeleteId === rem.id 
                      ? "bg-red-500 text-white px-3" 
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                  title="Xóa nhắc nhở"
                >
                  {confirmDeleteId === rem.id ? "Chắc chưa?" : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM CHÍNH THỨC --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-800">Tạo nhắc nhở bảo vệ sức khỏe</h2>
              <button onClick={closeModal} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Tên nội dung nhắc nhở</label>
                <input required className="w-full border-2 border-gray-100 focus:border-blue-500 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none" placeholder="VD: Đứng dậy đi lại, Uống nước..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Thời gian lặp lại (Phút)</label>
                <input type="number" required min={1} className="w-full border-2 border-gray-100 focus:border-blue-500 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none" value={interval} onChange={e => setIntervalValue(e.target.value)} />
              </div>

              {/* BỘ CHỌN ICON */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Biểu tượng (Icon)</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <div 
                      key={icon} onClick={() => setSelectedIcon(icon)}
                      className={`h-11 rounded-xl border-2 flex items-center justify-center text-xl cursor-pointer transition-all ${selectedIcon === icon ? 'border-gray-900 bg-gray-50 scale-105' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* BỘ CHỌN MÀU PASTEL */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Màu sắc hiển thị</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map(c => (
                    <div 
                      key={c.value} onClick={() => setSelectedColor(c.value)}
                      className="h-10 rounded-xl cursor-pointer border-2 flex items-center justify-center transition-transform hover:scale-105"
                      style={{ backgroundColor: c.value, borderColor: selectedColor === c.value ? '#0f172a' : 'transparent' }}
                    >
                      {selectedColor === c.value && <Check size={14} className="text-gray-700 font-bold" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md" style={{ backgroundColor: selectedColor, color: '#0f172a' }}>
                  {isSubmitting ? "Đang lưu..." : "Tạo nhắc nhở"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}