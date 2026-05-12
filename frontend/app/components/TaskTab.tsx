// app/components/TaskTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { 
  Plus, Trash2, Edit2, ChevronDown, ChevronRight, 
  Calendar, Flag, BarChart2 
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  content: string | null;
  status: string;
  priority: string;
  progress: number;
  dueDate: string | null;
  parentId: string | null;
  subTasks: Task[];
}

export default function TaskTab() {
  const { token } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  // State cho Modal tạo Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentIdForNewSubtask, setParentIdForNewSubtask] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setUserId(decoded.userId);
      fetchTasks(decoded.userId);
    }
  }, [token]);

  const fetchTasks = async (uId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${uId}`);
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error("Lỗi tải tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { userId, title, content, priority, dueDate, parentId: parentIdForNewSubtask };
    
    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchTasks(userId);
        closeModal();
      }
    } catch (err) {
      console.error("Lỗi tạo task:", err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này và các công việc con?")) return;
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "DELETE" });
      fetchTasks(userId);
    } catch (err) {
      console.error("Lỗi xóa task:", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setParentIdForNewSubtask(null);
  };

  // COMPONENT CON ĐỆ QUY ĐỂ VẼ TỪNG DÒNG TASK
  const TaskItem = ({ task, depth }: { task: Task; depth: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="mb-2">
        <div 
          className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:border-blue-300 transition-all ml-${depth * 6}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400">
              {task.subTasks.length > 0 ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <div className="w-[18px]"/>}
            </button>
            
            <div className="flex flex-col">
              <span className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </span>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                  task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[11px] text-gray-400 flex items-center">
                    <Calendar size={12} className="mr-1" /> {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Thanh tiến độ nhỏ */}
            <div className="w-24 bg-gray-100 rounded-full h-1.5 hidden md:block">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
            </div>
            
            <button 
              onClick={() => { setParentIdForNewSubtask(task.id); setIsModalOpen(true); }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Thêm việc con"
            >
              <Plus size={16} />
            </button>
            <button onClick={() => deleteTask(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Đệ quy: Nếu có subTasks và đang mở thì vẽ tiếp */}
        {isExpanded && task.subTasks && task.subTasks.length > 0 && (
          <div className="mt-2">
            {task.subTasks.map(sub => <TaskItem key={sub.id} task={sub} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách nhiệm vụ</h2>
        <button 
          onClick={() => { setParentIdForNewSubtask(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> <span>Thêm công việc lớn</span>
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl">
              <p className="text-gray-400">Chưa có nhiệm vụ nào. Hãy bắt đầu thôi!</p>
            </div>
          ) : (
            tasks.map(task => <TaskItem key={task.id} task={task} depth={0} />)
          )}
        </div>
      )}

      {/* MODAL TẠO TASK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {parentIdForNewSubtask ? "Thêm nhiệm vụ con" : "Thêm nhiệm vụ mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 text-black" 
                placeholder="Tên công việc..." 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)}
              />
              <textarea 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 text-black" 
                placeholder="Mô tả chi tiết..." 
                value={content} 
                onChange={e => setContent(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Ưu tiên</label>
                  <select 
                    className="w-full border p-2 rounded text-black"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Hạn chót</label>
                  <input 
                    type="date" 
                    className="w-full border p-2 rounded text-black"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500">Hủy</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}