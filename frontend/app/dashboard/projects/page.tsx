"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { useRouter } from "next/navigation";
import { 
  FolderKanban, Plus, Clock, LayoutList, Share2, 
  X, CheckCircle2, Lock, Edit2, Trash2, Calendar, 
  ChevronLeft, ChevronRight 
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
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE MODAL & FORM ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewType, setViewType] = useState("list"); 
  const [isStrictSequence, setIsStrictSequence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE PHÂN TRANG (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số lượng dự án trên 1 trang

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const res = await fetch(`http://localhost:5000/api/projects/${decoded.userId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  // Đóng form
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setTitle(""); setContent(""); setStartDate(""); setEndDate("");
    setViewType("list"); setIsStrictSequence(false);
  };

  // Mở form Sửa
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

  // Nút Lưu/Tạo mới (Gộp POST và PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;
    setIsSubmitting(true);

    try {
      const decoded: any = jwtDecode(token);
      
      const body = {
        userId: decoded.userId, title, content, 
        startDate: startDate || null, 
        endDate: endDate || null, 
        viewType, 
        isStrictSequence: viewType === 'sequence' ? isStrictSequence : false 
      };

      const url = editingProject 
        ? `http://localhost:5000/api/projects/${editingProject.id}` 
        : "http://localhost:5000/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchProjects();
        closeModal();    
      } else {
        alert("Lỗi máy chủ! Vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm Xóa (Kèm cảnh báo)
  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Bạn có chắc chắn muốn xóa Dự án này? Mọi nhiệm vụ bên trong sẽ bị mất vĩnh viễn.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        const newProjects = projects.filter(p => p.id !== id);
        setProjects(newProjects);
        // Nếu xóa hết item ở trang cuối, lùi về trang trước
        if (currentPage > 1 && newProjects.length <= (currentPage - 1) * itemsPerPage) {
          setCurrentPage(currentPage - 1);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- LOGIC PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10 relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <FolderKanban className="mr-3 text-blue-600" size={32} />
            Dự án & Tác vụ
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tất cả danh sách công việc và sơ đồ tuần tự của bạn.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center transition-colors"
        >
          <Plus size={18} className="mr-2"/> Dự án mới
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Chưa có dự án nào</h3>
          <p className="text-sm text-gray-400 mt-2">Bắt đầu bằng cách tạo dự án đầu tiên của bạn.</p>
        </div>
      ) : (
        <>
          {/* LƯỚI CARD DỰ ÁN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentProjects.map((project) => (
              <div 
                key={project.id}
                onClick={() => router.push(`/dashboard/project/${project.id}`)}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col h-full relative"
              >
                {project.isStrictSequence && (
                   <div className="absolute top-0 right-0 bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center shadow-sm">
                     <Lock size={12} className="mr-1"/> Khóa chặt
                   </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    {project.viewType === 'sequence' ? <Share2 size={24} /> : <LayoutList size={24} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${project.viewType === 'sequence' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {project.viewType === 'sequence' ? 'Sơ đồ' : 'Danh sách'}
                  </span>
                </div>
                
                <h3 className="font-bold text-xl text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{project.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">
                  {project.content || "Chưa có mô tả chi tiết."}
                </p>

                {/* Thời gian */}
                <div className="flex items-center text-xs text-gray-500 font-medium mb-4">
                  <Calendar size={14} className="mr-2 text-blue-400" />
                  {project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : "---"} 
                  <span className="mx-1.5">➔</span> 
                  {project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : "Vô thời hạn"}
                </div>

                {/* Thanh tiến độ */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-400">Tiến độ</span>
                    <span className="text-blue-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${project.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                {/* Thao tác (Footer của Card) */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center">
                    <Clock size={12} className="mr-1.5" /> Tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  
                  {/* Dùng stopPropagation để khi bấm Sửa/Xóa nó không nhảy sang trang chi tiết */}
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(project); }} 
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* THANH ĐIỀU HƯỚNG PHÂN TRANG */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* --- MODAL FORM CHUNG (TẠO/SỬA) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-800">{editingProject ? "Cập nhật dự án" : "Tạo dự án mới"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Tên dự án <span className="text-red-500">*</span></label>
                <input required className="w-full border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm font-bold text-gray-800 outline-none" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Mô tả</label>
                <textarea className="w-full border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm text-gray-700 outline-none resize-none" rows={2} value={content} onChange={e => setContent(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ngày bắt đầu</label>
                  <input type="date" className="w-full border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ngày kết thúc</label>
                  <input type="date" className="w-full border-2 border-gray-100 focus:border-blue-500 p-3 rounded-xl text-sm outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Loại quản lý</label>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => { setViewType('list'); setIsStrictSequence(false); }} className={`cursor-pointer border-2 rounded-xl p-3 flex items-center ${viewType === 'list' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'}`}>
                    <LayoutList size={20} className={`mr-3 ${viewType === 'list' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div><h4 className="font-bold text-sm">Danh sách</h4></div>
                  </div>
                  <div onClick={() => setViewType('sequence')} className={`cursor-pointer border-2 rounded-xl p-3 flex items-center ${viewType === 'sequence' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'}`}>
                    <Share2 size={20} className={`mr-3 ${viewType === 'sequence' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div><h4 className="font-bold text-sm">Sơ đồ</h4></div>
                  </div>
                </div>
              </div>

              {viewType === 'sequence' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start cursor-pointer" onClick={() => setIsStrictSequence(!isStrictSequence)}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border mr-3 mt-0.5 ${isStrictSequence ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>
                    {isStrictSequence && <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center"><Lock size={14} className="mr-1.5"/> Khóa tuần tự</h4>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                  {isSubmitting ? "Đang xử lý..." : editingProject ? "Lưu thay đổi" : "Tạo dự án"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}