"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  FileText, Plus, Trash2, Edit2, Pin, 
  Search, X, Globe, ExternalLink, Check 
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  url: string | null;
  color: string;
  isPinned: boolean;
  updatedAt: string;
}

// Danh sách mã màu Pastel chuẩn UI Google Keep cho người dùng lựa chọn
const NOTE_COLORS = [
  { name: "Vàng", value: "#fef08a" },
  { name: "Xanh dương", value: "#bfdbfe" },
  { name: "Xanh lá", value: "#bbf7d0" },
  { name: "Hồng", value: "#fbcfe8" },
  { name: "Tím", value: "#e9d5ff" },
  { name: "Trắng", value: "#ffffff" },
];

export default function NotesPage() {
  const { token } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE CHO MODAL FORM (TẠO/SỬA) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#fef08a");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gọi API tải danh sách ghi chú
  const fetchNotes = async () => {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const res = await fetch(`http://localhost:5000/api/notes/${decoded.userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Lỗi tải ghi chú:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setColor("#fef08a");
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setIsModalOpen(true);
  };

  // Hàm Xử lý Thêm hoặc Sửa Ghi chú
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;
    setIsSubmitting(true);

    try {
      const decoded: any = jwtDecode(token);
      
      const body = {
        userId: decoded.userId,
        title,
        content,
        color,
        url: editingNote ? editingNote.url : null // Giữ nguyên URL nếu đang sửa
      };

      const url = editingNote 
        ? `http://localhost:5000/api/notes/${editingNote.id}` 
        : "http://localhost:5000/api/notes";
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchNotes();
        closeModal();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý Ghim/Bỏ ghim nhanh ngay trên Card
  const togglePin = async (note: Note) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned })
      });
      if (res.ok) {
        // Cập nhật State cục bộ để đổi trạng thái tức thì tăng trải nghiệm mượt mà
        setNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n));
        // Fetch lại để Database tự sắp xếp đúng thứ tự Pinned lên đầu
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Hàm Xóa Ghi chú
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lọc ghi chú theo ô Tìm kiếm (Tìm theo tiêu đề hoặc nội dung)
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Phân loại mảng để hiển thị nhóm "Được ghim" riêng biệt nếu có
  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10">
      
      {/* KHU VỰC HEADER VÀ Ô TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <FileText className="mr-3 text-blue-600" size={32} />
            Ghi chú nhanh
          </h1>
          <p className="text-sm text-gray-500 mt-1">Lưu trữ ý tưởng, tài liệu học tập và thông tin thu thập từ trình duyệt.</p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex items-center space-x-3 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm tiêu đề, nội dung..."
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500 shadow-sm transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center shrink-0"
            title="Tạo ghi chú mới"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {notes.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có ghi chú nào</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Bấm nút dấu cộng hoặc sử dụng Chrome Extension để lưu lại những dòng ghi chú đầu tiên khi đọc báo, tài liệu nhé!
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-10">
          
          {/* PHẦN 1: CÁC GHI CHÚ ĐƯỢC GHIM */}
          {pinnedNotes.length > 0 && (
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">ĐƯỢC GHIM ({pinnedNotes.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onEdit={openEditModal} onDelete={handleDeleteNote} onTogglePin={togglePin} />)}
              </div>
            </div>
          )}

          {/* PHẦN 2: CÁC GHI CHÚ KHÁC */}
          {otherNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">KHÁC</span>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {otherNotes.map(note => <NoteCard key={note.id} note={note} onEdit={openEditModal} onDelete={handleDeleteNote} onTogglePin={togglePin} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL FORM TẠO/SỬA GHI CHÚ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800">{editingNote ? "Sửa ghi chú" : "Tạo ghi chú mới"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col flex-1 overflow-hidden space-y-5">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Tiêu đề ghi chú <span className="text-red-500">*</span></label>
                <input 
                  autoFocus required
                  className="w-full border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm font-bold text-gray-800 outline-none transition-colors" 
                  placeholder="Nhập tiêu đề nhanh..." 
                  value={title} onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[150px]">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Nội dung chi tiết</label>
                <textarea 
                  className="w-full flex-1 border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm text-gray-700 outline-none resize-none transition-colors" 
                  placeholder="Gõ ý tưởng hoặc nội dung vào đây..." 
                  value={content} onChange={e => setContent(e.target.value)} 
                />
              </div>

              {/* BỘ CHỌN MÀU PASTEL SẮC SỠ */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Màu sắc thẻ dán</label>
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {NOTE_COLORS.map((c) => (
                    <div 
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className="w-8 h-8 rounded-full border border-gray-300/60 cursor-pointer flex items-center justify-center shadow-sm hover:scale-110 transition-transform relative"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {color === c.value && <Check size={14} className="text-gray-700 font-bold" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition-colors">
                  {isSubmitting ? "Đang lưu..." : editingNote ? "Lưu thay đổi" : "Tạo ghi chú"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENT CARD THẺ DÁN (STICKY NOTE CARD)
// ==========================================
function NoteCard({ note, onEdit, onDelete, onTogglePin }: { note: Note, onEdit: (n: Note) => void, onDelete: (id: string) => void, onTogglePin: (n: Note) => void }) {
  return (
    <div 
      className="rounded-2xl border border-gray-200/50 p-5 flex flex-col min-h-[200px] shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
      style={{ backgroundColor: note.color }}
    >
      {/* Nút Ghim nhanh ở góc trên bên phải */}
      <button 
        onClick={() => onTogglePin(note)}
        className={`absolute top-4 right-4 p-1.5 rounded-lg border bg-white/80 backdrop-blur-sm transition-all shadow-sm ${
          note.isPinned 
            ? 'text-yellow-600 border-yellow-200' 
            : 'text-gray-400 border-gray-100 opacity-0 group-hover:opacity-100'
        }`}
        title={note.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
      >
        <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
      </button>

      {/* Nội dung chữ */}
      <div className="flex-1 min-w-0 pr-6">
        <h4 className="font-bold text-gray-900 text-base mb-2 truncate leading-tight">{note.title}</h4>
        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed break-words line-clamp-6">
          {note.content || <span className="text-gray-400 italic">Không có nội dung</span>}
        </p>
      </div>

      {/* Footer chứa Link nguồn (nếu có) và nút bấm Thao tác */}
      <div className="mt-5 pt-3 border-t border-gray-900/5 flex flex-col gap-3 justify-end">
        {/* Nếu note này được lấy từ Extension -> Hiện link website gốc */}
        {note.url && (
          <a 
            href={note.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-[10px] font-bold text-blue-700/80 hover:text-blue-700 bg-white/60 hover:bg-white border border-blue-100/50 px-2 py-1 rounded-md transition-colors truncate max-w-full"
            title={note.url}
          >
            <Globe size={11} className="mr-1 shrink-0" />
            <span className="truncate flex-1 font-semibold">Nguồn: {note.url}</span>
            <ExternalLink size={10} className="ml-1 shrink-0 opacity-60" />
          </a>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-bold uppercase">
            {new Date(note.updatedAt).toLocaleDateString('vi-VN')}
          </span>

          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(note)}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white/80 border border-transparent hover:border-gray-200 rounded transition-all"
              title="Chỉnh sửa"
            >
              <Edit2 size={13} />
            </button>
            <button 
              onClick={() => onDelete(note.id)}
              className="p-1 text-gray-600 hover:text-red-600 hover:bg-white/80 border border-transparent hover:border-gray-200 rounded transition-all"
              title="Xóa"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}