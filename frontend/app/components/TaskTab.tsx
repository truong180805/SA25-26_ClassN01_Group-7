"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { 
  Plus, Trash2, Edit2, List, GitMerge, Lock, Calendar, MoreHorizontal
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  content: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  viewType: string;
  isStrictSequence: boolean;
  _count?: { tasks: number };
}

export default function TaskTab() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  // States cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewType, setViewType] = useState("list");
  const [isStrictSequence, setIsStrictSequence] = useState(false);

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setUserId(decoded.userId);
      fetchProjects(decoded.userId);
    }
  }, [token]);

  const fetchProjects = async (uId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${uId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Lỗi tải Projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setContent(project.content || "");
    setStartDate(project.startDate ? project.startDate.split('T')[0] : "");
    setEndDate(project.endDate ? project.endDate.split('T')[0] : "");
    setViewType(project.viewType);
    setIsStrictSequence(project.isStrictSequence);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { 
      userId, title, content, 
      startDate: startDate || null, 
      endDate: endDate || null, 
      viewType, isStrictSequence 
    };
    
    const url = editingProject 
      ? `http://localhost:5000/api/projects/${editingProject.id}`
      : "http://localhost:5000/api/projects";
    
    const method = editingProject ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchProjects(userId);
        closeModal();
      }
    } catch (err) {
      console.error("Lỗi xử lý Project:", err);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("⚠️ Bạn có chắc chắn muốn xóa Công việc này? Mọi nhiệm vụ bên trong sẽ bị mất vĩnh viễn.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) fetchProjects(userId);
    } catch (err) {
      console.error("Lỗi xóa Project:", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setTitle(""); setContent(""); setStartDate(""); setEndDate("");
    setViewType("list"); setIsStrictSequence(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Công việc</h2>
          <p className="text-gray-500 mt-1">Danh sách các dự án và tiến độ tổng quát của bạn.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={20} /> <span className="font-bold">Tạo Công việc mới</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed rounded-3xl shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <List size={40} />
          </div>
          <p className="text-gray-500 font-medium">Chưa có công việc nào được tạo.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:underline mt-2 font-bold">Bắt đầu dự án đầu tiên của bạn</button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Dự án</th>
                <th className="px-6 py-5">Cấu hình</th>
                <th className="px-6 py-5">Thời gian</th>
                <th className="px-6 py-5 w-64">Tiến độ</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => router.push(`/dashboard/project/${project.id}`)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{project.title}</span>
                      <span className="text-sm text-gray-400 mt-0.5 line-clamp-1">{project.content || "Không có mô tả..."}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600">
                        {project.viewType === 'list' ? <List size={12} className="mr-1"/> : <GitMerge size={12} className="mr-1"/>}
                        {project.viewType === 'list' ? 'DANH SÁCH' : 'SƠ ĐỒ'}
                      </span>
                      {project.isStrictSequence && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-600">
                          <Lock size={12} className="mr-1"/> KHÓA CHẶT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm">
                    {project.endDate ? (
                      <div className="flex items-center text-gray-500 font-medium">
                        <Calendar size={14} className="mr-2 text-blue-400" />
                        {new Date(project.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    ) : <span className="text-gray-300 italic">Vô thời hạn</span>}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ease-out ${project.progress === 100 ? 'bg-green-500' : 'bg-blue-500 shadow-sm shadow-blue-200'}`} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">
              {editingProject ? "Cập nhật Công việc" : "Tạo Công việc mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tiêu đề dự án</label>
                <input 
                  className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 text-black outline-none font-medium transition-all" 
                  placeholder="Nhập tên công việc..." required 
                  value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả ngắn</label>
                <textarea 
                  className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 text-black outline-none font-medium transition-all" 
                  placeholder="Ghi chú nhanh về mục tiêu..." rows={2}
                  value={content} onChange={e => setContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                  <input 
                    type="date" className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-black outline-none"
                    value={startDate} onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ngày kết thúc</label>
                  <input 
                    type="date" className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-black outline-none"
                    value={endDate} onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Chế độ hiển thị</label>
                  <select 
                    className="bg-white border-none text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    value={viewType} onChange={e => setViewType(e.target.value)}
                  >
                    <option value="list">📝 Dạng Danh sách</option>
                    <option value="sequence">🔀 Sơ đồ tuần tự</option>
                  </select>
                </div>
                <div className="flex items-center justify-between opacity-80">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Khóa tác vụ tuần tự</label>
                    <p className="text-[10px] text-slate-400">Chỉ mở task sau khi xong task trước.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded-lg cursor-pointer"
                    checked={isStrictSequence} onChange={e => setIsStrictSequence(e.target.checked)}
                    disabled={viewType === 'list'}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={closeModal} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Hủy bỏ</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100">
                  {editingProject ? "Lưu thay đổi" : "Khởi tạo ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}