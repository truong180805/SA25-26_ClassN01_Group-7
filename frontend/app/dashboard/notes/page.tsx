"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  FileText, Plus, Trash2, Pin, Search, X, Globe, 
  ExternalLink, Check, Briefcase, Save 
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  url: string | null;
  color: string;
  isPinned: boolean;
  workspaceId: string | null;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  color: string;
}

const NOTE_COLORS = [
  { name: "Vàng", value: "#fef08a" }, { name: "Xanh dương", value: "#bfdbfe" },
  { name: "Xanh lá", value: "#bbf7d0" }, { name: "Hồng", value: "#fbcfe8" },
  { name: "Tím", value: "#e9d5ff" }, { name: "Trắng", value: "#ffffff" },
];

export default function NotesPage() {
  const { token } = useAuthStore();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState("");

  // --- STATE CHO MODAL MỞ TO (CHI TIẾT & SỬA) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#fef08a");
  const [workspaceId, setWorkspaceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setUserId(decoded.userId);
      fetchNotes(decoded.userId);
      fetchWorkspaces(decoded.userId);
    }
  }, [token]);

  const fetchNotes = async (uId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${uId}`);
      if (res.ok) setNotes(await res.json());
    } catch (err) { console.error("Lỗi tải ghi chú:", err); }
    finally { setLoading(false); }
  };

  const fetchWorkspaces = async (uId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/workspaces/user/${uId}`);
      if (res.ok) setWorkspaces(await res.json());
    } catch (err) { console.error("Lỗi tải Workspace:", err); }
  };

  // --- ĐIỀU KHIỂN MODAL ---
  const openCreateModal = () => {
    setEditingNote(null);
    setTitle(""); setContent(""); setColor("#fef08a"); setWorkspaceId("");
    setIsModalOpen(true);
  };

  const openDetailModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setWorkspaceId(note.workspaceId || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // --- LƯU GHI CHÚ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !userId) return;
    setIsSubmitting(true);

    try {
      const body = {
        userId, title, content, color,
        workspaceId: workspaceId || null,
        url: editingNote ? editingNote.url : null 
      };

      const url = editingNote ? `http://localhost:5000/api/notes/${editingNote.id}` : `http://localhost:5000/api/notes`;
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchNotes(userId);
        closeModal();
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const togglePin = async (note: Note) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned })
      });
      if (res.ok) fetchNotes(userId);
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id));
        closeModal(); // Đóng modal nếu đang mở
      }
    } catch (err) { console.error(err); }
  };

  // Lọc ghi chú
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getWorkspaceInfo = (wId: string | null) => {
    if (!wId) return null;
    return workspaces.find(w => w.id === wId) || null;
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10 animate-in fade-in duration-500">
      
      {/* HEADER & TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <FileText className="mr-3 text-blue-600" size={32} />
            Ghi chú nhanh
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý ý tưởng và các ghi chú được lưu từ trình duyệt.</p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Tìm kiếm ghi chú..."
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500 shadow-sm"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold shadow-sm transition-colors shrink-0">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText size={32} /></div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có ghi chú nào</h3>
          <p className="text-sm text-gray-400 mt-2">Dùng Extension để lưu chữ nhanh khi duyệt web, hoặc tạo mới ngay tại đây.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* CÁC GHI CHÚ ĐƯỢC GHIM */}
          {pinnedNotes.length > 0 && (
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">ĐƯỢC GHIM</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} wsInfo={getWorkspaceInfo(note.workspaceId)} onClick={() => openDetailModal(note)} onTogglePin={() => togglePin(note)} />
                ))}
              </div>
            </div>
          )}

          {/* CÁC GHI CHÚ KHÁC */}
          {otherNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">KHÁC</span>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {otherNotes.map(note => (
                   <NoteCard key={note.id} note={note} wsInfo={getWorkspaceInfo(note.workspaceId)} onClick={() => openDetailModal(note)} onTogglePin={() => togglePin(note)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL MỞ TO: XEM VÀ SỬA GHI CHÚ TRỰC TIẾP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl animate-in zoom-in-95 transition-colors duration-300 relative"
            style={{ backgroundColor: color, height: '80vh' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Header của Modal */}
              <div className="flex justify-between items-center p-5 border-b border-black/5 shrink-0">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-black uppercase tracking-widest opacity-50">
                    {editingNote ? "CHỈNH SỬA GHI CHÚ" : "TẠO GHI CHÚ MỚI"}
                  </span>
                  {editingNote && (
                    <button type="button" onClick={() => editingNote && togglePin(editingNote)} className={`p-1.5 rounded-lg transition-all ${editingNote.isPinned ? 'bg-yellow-100 text-yellow-700' : 'bg-black/5 hover:bg-black/10 text-gray-600'}`} title="Ghim">
                      <Pin size={16} fill={editingNote.isPinned ? "currentColor" : "none"} />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editingNote && (
                    <button type="button" onClick={() => handleDeleteNote(editingNote.id)} className="p-2 text-red-600 hover:bg-red-100/50 rounded-full transition-colors"><Trash2 size={18}/></button>
                  )}
                  <button type="button" onClick={closeModal} className="p-2 text-gray-700 hover:bg-black/10 rounded-full transition-colors"><X size={20}/></button>
                </div>
              </div>

              {/* Body: Form nhập liệu vô hình (Seamless Input) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col space-y-4">
                <input 
                  autoFocus required
                  className="w-full bg-transparent border-none text-3xl md:text-4xl font-black text-gray-900 outline-none placeholder:text-gray-900/30" 
                  placeholder="Tiêu đề ghi chú..." 
                  value={title} onChange={e => setTitle(e.target.value)} 
                />
                
                <textarea 
                  className="w-full flex-1 bg-transparent border-none text-lg text-gray-800 outline-none resize-none placeholder:text-gray-800/40 leading-relaxed" 
                  placeholder="Nhập nội dung ý tưởng của bạn..." 
                  value={content} onChange={e => setContent(e.target.value)} 
                />
                
                {/* Hiển thị Nguồn Web nếu có */}
                {editingNote?.url && (
                  <div className="pt-4 border-t border-black/5">
                    <a href={editingNote.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-bold text-blue-700 hover:text-blue-900 bg-white/40 hover:bg-white/60 px-3 py-1.5 rounded-lg transition-colors max-w-full">
                      <Globe size={14} className="mr-2 shrink-0" />
                      <span className="truncate">{editingNote.url}</span>
                      <ExternalLink size={12} className="ml-2 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Footer: Chọn Màu, Chọn Workspace & Nút Lưu */}
              <div className="p-5 bg-white/40 backdrop-blur-md border-t border-black/5 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-3xl">
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Dropdown Workspace */}
                  <select 
                    className="bg-white/60 border border-white focus:border-blue-400 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-800 outline-none cursor-pointer flex-1 md:flex-none shadow-sm"
                    value={workspaceId} onChange={e => setWorkspaceId(e.target.value)}
                  >
                    <option value="">📁 Không gán Workspace</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>📁 {ws.name}</option>
                    ))}
                  </select>

                  {/* Bảng chọn màu thu gọn */}
                  <div className="flex space-x-1.5 bg-white/60 p-1.5 rounded-xl border border-white shadow-sm">
                    {NOTE_COLORS.map(c => (
                      <div 
                        key={c.value} onClick={() => setColor(c.value)} title={c.name}
                        className={`w-7 h-7 rounded-lg cursor-pointer border flex items-center justify-center transition-transform hover:scale-110 ${color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.value }}
                      >
                        {color === c.value && <Check size={12} className="text-gray-800 font-bold" />}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm bg-gray-900 hover:bg-black text-white shadow-lg disabled:opacity-50 transition-colors flex items-center justify-center">
                  <Save size={16} className="mr-2" /> {isSubmitting ? "Đang lưu..." : "Lưu Ghi chú"}
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
// COMPONENT CARD GHI CHÚ
// ==========================================
function NoteCard({ note, wsInfo, onClick, onTogglePin }: { note: Note, wsInfo: Workspace | null, onClick: () => void, onTogglePin: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="rounded-3xl border border-black/5 p-6 flex flex-col h-[240px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
      style={{ backgroundColor: note.color }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={`absolute top-5 right-5 p-1.5 rounded-xl bg-white/60 backdrop-blur-sm transition-all z-10 ${note.isPinned ? 'text-yellow-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
      >
        <Pin size={16} fill={note.isPinned ? "currentColor" : "none"} />
      </button>

      <div className="flex-1 min-w-0 pr-6 overflow-hidden">
        <h4 className="font-black text-gray-900 text-lg mb-2 truncate">{note.title}</h4>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed opacity-80 line-clamp-4">
          {note.content || "Không có nội dung..."}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-black/10 flex flex-col gap-2 shrink-0">
        {wsInfo && (
           <span className="inline-flex items-center px-2 py-1 rounded bg-white/50 text-[10px] font-bold text-gray-800 w-max border border-white/50">
             <Briefcase size={10} className="mr-1.5" style={{ color: wsInfo.color }} /> {wsInfo.name}
           </span>
        )}
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          {new Date(note.updatedAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </div>
  );
}