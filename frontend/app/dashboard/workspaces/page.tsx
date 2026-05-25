"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Briefcase, ExternalLink, Trash2, Globe, 
  Clock, Layers, Plus, Edit2, X, Check, Link as LinkIcon 
} from "lucide-react";

interface WorkspaceTab {
  id?: string;
  title: string;
  url: string;
  favicon?: string | null;
}

interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  tabs: WorkspaceTab[];
}

const WS_COLORS = [
  { name: "Xanh dương", value: "#3b82f6" }, { name: "Tím", value: "#8b5cf6" },
  { name: "Hồng", value: "#ec4899" }, { name: "Đỏ", value: "#ef4444" },
  { name: "Cam", value: "#f97316" }, { name: "Vàng", value: "#eab308" },
  { name: "Xanh lá", value: "#10b981" }, { name: "Xám đen", value: "#475569" },
];

export default function WorkspacesPage() {
  const { token } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO MODAL TẠO/SỬA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  
  // STATE MỚI: Quản lý danh sách các link bên trong Modal
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkspaces = async () => {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const res = await fetch(`http://localhost:5000/api/workspaces/user/${decoded.userId}`);
      if (res.ok) setWorkspaces(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkspaces(); }, [token]);

  const handleOpenWorkspace = (tabs: WorkspaceTab[]) => {
    if (tabs.length === 0) return alert("Chưa có liên kết nào!");
    tabs.forEach((tab, index) => {
      setTimeout(() => window.open(tab.url, "_blank"), index * 200);
    });
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Chắc chắn xóa Không gian làm việc này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/workspaces/${id}`, { method: "DELETE" });
      if (res.ok) setWorkspaces(workspaces.filter((w) => w.id !== id));
    } catch (err) { console.error(err); }
  };

  // --- LOGIC ĐIỀU KHIỂN FORM ---
  const openCreateModal = () => {
    setEditingWs(null);
    setName(""); setColor("#3b82f6"); setTabs([]); // Modal trống trải
    setIsModalOpen(true);
  };

  const openEditModal = (ws: Workspace) => {
    setEditingWs(ws);
    setName(ws.name);
    setColor(ws.color || "#3b82f6");
    // Nạp danh sách link cũ vào Form để sửa
    setTabs(ws.tabs.map(t => ({ title: t.title, url: t.url, favicon: t.favicon }))); 
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTabs([]);
  };

  // --- LOGIC THÊM/SỬA/XÓA LINK TRONG MODAL ---
  const handleAddTab = () => {
    setTabs([...tabs, { title: "", url: "" }]);
  };

  const handleRemoveTab = (index: number) => {
    setTabs(tabs.filter((_, i) => i !== index));
  };

  const handleTabChange = (index: number, field: "title" | "url", value: string) => {
    const newTabs = [...tabs];
    newTabs[index][field] = value;
    setTabs(newTabs);
  };

  // --- GỬI DỮ LIỆU LÊN BACKEND ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token) return;
    
    // Lọc bỏ các tab trống (chưa nhập URL)
    const validTabs = tabs.filter(t => t.url.trim() !== "");
    
    setIsSubmitting(true);
    try {
      const decoded: any = jwtDecode(token);
      const body = { 
        userId: decoded.userId, name, color, icon: "Briefcase", 
        tabs: validTabs 
      };

      const url = editingWs ? `http://localhost:5000/api/workspaces/${editingWs.id}` : `http://localhost:5000/api/workspaces`;
      const method = editingWs ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchWorkspaces();
        closeModal();
      } else { alert("Lỗi khi lưu!"); }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <Layers className="mr-3 text-blue-600" size={32} /> Workspaces
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Nhóm các trang web để truy cập nhanh bằng 1 click.</p>
        </div>
        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center transition-colors">
          <Plus size={18} className="mr-2" /> Tạo Workspace mới
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase size={32} /></div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có Không gian nào</h3>
          <p className="text-sm text-gray-400 mt-2">Bấm nút tạo mới hoặc dùng Extension để lưu tab nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div key={ws.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
              <div className="p-6 border-b border-gray-50 flex items-start justify-between bg-gray-50/30">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: ws.color || "#3b82f6" }}>
                    <Briefcase size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-base truncate">{ws.name}</h3>
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center mt-0.5 uppercase"><Clock size={12} className="mr-1" />{new Date(ws.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(ws)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteWorkspace(ws.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Liên kết đính kèm ({ws.tabs.length})</span>
                  {ws.tabs.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2">Chưa có trang web nào.</div>
                  ) : (
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {ws.tabs.map((tab, i) => (
                        <a key={i} href={tab.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-gray-600 hover:text-blue-600 py-1 group/link">
                          {tab.favicon ? <img src={tab.favicon} className="w-3.5 h-3.5 rounded mr-2 shrink-0" alt="" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} /> : <Globe size={14} className="text-gray-400 mr-2 shrink-0" />}
                          <span className="truncate flex-1 font-medium">{tab.title}</span>
                          <ExternalLink size={12} className="text-gray-300 opacity-0 group-hover/link:opacity-100 ml-1 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => handleOpenWorkspace(ws.tabs)} disabled={ws.tabs.length === 0} className="w-full mt-6 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50" style={{ backgroundColor: ws.tabs.length > 0 ? (ws.color || "#3b82f6") : "#94a3b8" }}>
                  <span>MỞ MÔI TRƯỜNG LÀM VIỆC</span> <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM CHÍNH THỨC --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-black text-gray-800">{editingWs ? "Chỉnh sửa Workspace" : "Tạo Workspace mới"}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>

            {/* Body Modal có thể cuộn (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Tên không gian <span className="text-red-500">*</span></label>
                <input required className="w-full border-2 border-gray-100 focus:border-blue-500 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none" placeholder="VD: Dự án AI..." value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Màu sắc</label>
                <div className="grid grid-cols-4 gap-3">
                  {WS_COLORS.map((c) => (
                    <div key={c.value} onClick={() => setColor(c.value)} className="h-10 rounded-xl cursor-pointer flex items-center justify-center border-2 transition-transform hover:scale-105" style={{ backgroundColor: c.value, borderColor: color === c.value ? '#1e293b' : 'transparent' }}>
                      {color === c.value && <Check size={16} className="text-white" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* KHU VỰC THÊM LINKS ĐỘNG */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Danh sách Liên kết ({tabs.length})</label>
                  <button type="button" onClick={handleAddTab} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center transition-colors">
                    <Plus size={14} className="mr-1"/> Thêm link
                  </button>
                </div>
                
                <div className="space-y-3">
                  {tabs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Chưa có liên kết nào. Bấm nút Thêm link ở trên.</p>}
                  
                  {tabs.map((tab, index) => (
                    <div key={index} className="flex items-start space-x-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
                      <div className="pt-2 text-gray-300"><LinkIcon size={16} /></div>
                      <div className="flex-1 space-y-2">
                        <input type="text" placeholder="Tên trang (VD: Github Repo)" value={tab.title} onChange={(e) => handleTabChange(index, "title", e.target.value)} className="w-full text-xs font-bold border-b border-gray-100 pb-1 outline-none text-gray-700" />
                        <input type="url" placeholder="https://..." value={tab.url} onChange={(e) => handleTabChange(index, "url", e.target.value)} className="w-full text-[11px] outline-none text-blue-600" />
                      </div>
                      <button type="button" onClick={() => handleRemoveTab(index)} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal Cố định */}
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100">Hủy</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-50" style={{ backgroundColor: color }}>
                {isSubmitting ? "Đang lưu..." : editingWs ? "Lưu thay đổi" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}