"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { 
  ArrowLeft, Plus, Calendar, Trash2, CheckCircle2, Circle, 
  Edit2, X
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  content: string | null;
  priority: string;
  dueDate: string | null;
  isCompleted: boolean;
  parentId: string | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const projectId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentIdForNewTask, setParentIdForNewTask] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (token) fetchTasks();
  }, [projectId, token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Logic gọi API siêu đơn giản vì Backend đã gánh phần Trigger
  const toggleTaskStatus = async (clickedTask: Task) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${clickedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !clickedTask.isCompleted }),
      });
      await fetchTasks(); // Tải lại để lấy trạng thái mới do Backend tự tính
    } catch (err) { console.error(err); }
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const decoded: any = jwtDecode(token!);
    
    // LOGIC FIX: Nếu đang sửa, hãy lấy parentId cũ của chính task đó. 
    // Nếu là tạo mới, mới lấy parentId từ biến state.
    const finalParentId = editingTask ? editingTask.parentId : parentIdForNewTask;

    const body = { 
      userId: decoded.userId, 
      projectId, 
      title, 
      content, 
      priority,
      dueDate: dueDate || null, 
      parentId: finalParentId, // Sử dụng ID đã được kiểm tra
    };

    const url = editingTask ? `http://localhost:5000/api/tasks/${editingTask.id}` : "http://localhost:5000/api/tasks";
    const method = editingTask ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchTasks();
        closeModal();
      }
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Xóa nhiệm vụ này? Các nhiệm vụ con cũng sẽ bị xóa theo.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title); setContent(task.content || "");
    setPriority(task.priority); setDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false); setEditingTask(null);
    setTitle(""); setContent(""); setPriority("medium"); setDueDate("");
    setParentIdForNewTask(null);
  };

  const getSortedTasks = (taskList: Task[]) => {
    const pWeight: any = { high: 3, medium: 2, low: 1 };
    return [...taskList].sort((a, b) => {
      if (sortBy === "dueDate") return new Date(a.dueDate || "9999").getTime() - new Date(b.dueDate || "9999").getTime();
      if (sortBy === "priority") return pWeight[b.priority] - pWeight[a.priority];
      return 0;
    });
  };

  // --- GIAO DIỆN HÀNG NHIỆM VỤ ĐÃ ĐƯỢC CĂN CHỈNH ---
  const TaskRow = ({ task, depth }: { task: Task; depth: number }) => {
    // Tìm các task con trực tiếp của task này
    const rawChildren = tasks.filter(t => t.parentId === task.id);
    // SẮP XẾP các task con trước khi hiển thị
    const sortedChildren = getSortedTasks(rawChildren);
    
    return (
      <div className="flex flex-col border-b border-gray-100 last:border-none">
        <div 
          className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors group"
          style={{ paddingLeft: `${depth * 2.5 + 1}rem` }}
        >
          {/* Cột trái: Tích hoàn thành + Tiêu đề */}
          <div className="flex items-center flex-1 min-w-0 pr-4">
            {depth > 0 && <div className="w-4 h-px bg-gray-300 mr-2 shrink-0"></div>}
            <button 
              onClick={() => toggleTaskStatus(task)} 
              className={`mr-3 shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
            >
              {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <div className="flex flex-col truncate">
              <span className={`text-sm font-semibold truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.title}
              </span>
              {task.content && <span className="text-xs text-gray-400 truncate mt-0.5">{task.content}</span>}
            </div>
          </div>

          {/* Cột phải: Thông tin */}
          <div className="flex items-center shrink-0">
            <div className="w-[80px] flex justify-center">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                task.priority === 'high' ? 'bg-red-50 text-red-500' : 
                task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-500'
              }`}>
                {task.priority}
              </span>
            </div>

            <div className="w-[100px] flex justify-end">
              {task.dueDate ? (
                <span className="text-[11px] text-gray-400 font-medium flex items-center">
                  <Calendar size={12} className="mr-1.5" />
                  {new Date(task.dueDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                </span>
              ) : (
                <span className="text-[11px] text-gray-300 italic">-</span>
              )}
            </div>

            <div className="w-[100px] flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white hover:bg-blue-50 border border-transparent hover:border-blue-100"><Edit2 size={14} /></button>
              <button onClick={() => { setParentIdForNewTask(task.id); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white hover:bg-blue-50 border border-transparent hover:border-blue-100"><Plus size={14} /></button>
              <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-white hover:bg-red-50 border border-transparent hover:border-red-100"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
        
        {/* Render danh sách con đã được sắp xếp */}
        <div className="flex flex-col">
          {sortedChildren.map(sub => <TaskRow key={sub.id} task={sub} depth={depth + 1} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-800">Chi tiết Nhiệm vụ</h1>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center">
            <Plus size={18} className="mr-2"/> Nhiệm vụ mới
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{tasks.length} TỔNG SỐ NHIỆM VỤ</span>
          <div className="flex items-center space-x-2 bg-white border px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Sắp xếp:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer">
              <option value="createdAt">Ngày tạo</option><option value="dueDate">Hạn chót</option><option value="priority">Độ ưu tiên</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? <div className="p-20 text-center text-gray-400">Đang tải dữ liệu...</div> : tasks.length === 0 ? <div className="p-20 text-center text-gray-400">Chưa có nhiệm vụ nào. Nhấn "Nhiệm vụ mới" để bắt đầu.</div> : (
             <div className="flex flex-col">
               {getSortedTasks(tasks.filter(t => !t.parentId)).map(t => <TaskRow key={t.id} task={t} depth={0} />)}
             </div>
          )}
        </div>
      </main>

      {/* --- MODAL TẠO NHIỆM VỤ (ĐƯỢC LÀM LẠI THEO MẪU XỊN) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* Cột trái: Nội dung */}
            <div className="flex-1 p-8 border-r border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6 md:hidden">
                <h3 className="text-lg font-bold text-gray-800">{editingTask ? "Sửa nhiệm vụ" : "Tạo nhiệm vụ"}</h3>
                <button onClick={closeModal} className="text-gray-400"><X size={20} /></button>
              </div>
              <input 
                className="w-full text-2xl font-bold text-gray-800 placeholder:text-gray-300 outline-none mb-4" 
                placeholder="Tên nhiệm vụ..." required autoFocus
                value={title} onChange={e => setTitle(e.target.value)}
              />
              <textarea 
                className="w-full text-gray-600 placeholder:text-gray-400 outline-none min-h-[150px] resize-none flex-1" 
                placeholder="Ghi chú chi tiết..."
                value={content} onChange={e => setContent(e.target.value)}
              />
            </div>

            {/* Cột phải: Thuộc tính & Lưu */}
            <div className="w-full md:w-72 bg-gray-50 flex flex-col">
              <div className="p-6 flex-1 space-y-6">
                <div className="hidden md:flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{editingTask ? "Cập nhật" : "Tạo mới"}</span>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-200 p-1 rounded-full"><X size={14} /></button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Độ ưu tiên</label>
                  <div className="flex flex-col gap-2">
                    {['high', 'medium', 'low'].map(p => (
                      <button 
                        key={p} type="button" onClick={() => setPriority(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-between border ${
                          priority === p 
                            ? (p === 'high' ? 'bg-red-50 border-red-200 text-red-600' : p === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-blue-50 border-blue-200 text-blue-600') 
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {p}
                        {priority === p && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Thời hạn (Due Date)</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={dueDate} onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Nút Submit */}
              <div className="p-6 bg-gray-100 border-t border-gray-200">
                <button 
                  onClick={handleCreateOrUpdateTask}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors"
                >
                  {editingTask ? "Lưu thay đổi" : "Lưu nhiệm vụ"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}