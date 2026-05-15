"use client";

import { useState } from "react";
import { 
  Plus, Calendar, Trash2, CheckCircle2, Circle, 
  Edit2, X, Pin, Paperclip, Briefcase
} from "lucide-react";
import TaskDetailDrawer from "./TaskDetailDrawer";

interface Task {
  id: string; title: string; content: string | null;
  priority: string; dueDate: string | null;
  isCompleted: boolean; parentId: string | null;
  isPinned: boolean; createdAt: string;
}

interface TaskListViewProps {
  tasks: Task[];
  onRefresh: () => void;
  projectId: string;
  userId: string;
}

export default function TaskListView({ tasks, onRefresh, projectId, userId }: TaskListViewProps) {
  const [sortBy, setSortBy] = useState("createdAt");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentIdForNewTask, setParentIdForNewTask] = useState<string | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const toggleTaskStatus = async (task: Task) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const togglePin = async (taskId: string, currentStatus: boolean) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentStatus }),
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalParentId = editingTask ? editingTask.parentId : parentIdForNewTask;
    const body = { 
      userId, projectId, title, content, priority,
      dueDate: dueDate || null, parentId: finalParentId,
    };
    const url = editingTask ? `http://localhost:5000/api/tasks/${editingTask.id}` : "http://localhost:5000/api/tasks";
    const method = editingTask ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { onRefresh(); closeModal(); }
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Xóa nhiệm vụ này?")) return;
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const closeModal = () => {
    setIsModalOpen(false); setEditingTask(null);
    setTitle(""); setContent(""); setPriority("medium"); setDueDate("");
    setParentIdForNewTask(null);
  };

  const getSortedTasks = (taskList: Task[]) => {
    const pWeight: any = { high: 3, medium: 2, low: 1 };
    return [...taskList].sort((a, b) => {
      if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "dueDate") return new Date(a.dueDate || "9999").getTime() - new Date(b.dueDate || "9999").getTime();
      if (sortBy === "priority") return pWeight[b.priority] - pWeight[a.priority];
      return 0;
    });
  };

  const TaskRow = ({ task, depth }: { task: Task; depth: number }) => {
    const sortedChildren = getSortedTasks(tasks.filter(t => t.parentId === task.id));
    return (
      <div className="flex flex-col border-b border-gray-100 last:border-none">
        <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors group ${task.isPinned ? 'bg-yellow-50/40' : ''}`} style={{ paddingLeft: `${depth * 2.5 + 1}rem` }}>
          <div className="flex items-center flex-1 min-w-0 pr-4">
            {depth > 0 && <div className="w-4 h-px bg-gray-300 mr-2 shrink-0"></div>}
            {depth === 0 && (
              <button onClick={() => togglePin(task.id, task.isPinned)} className={`mr-2 shrink-0 ${task.isPinned ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500 opacity-0 group-hover:opacity-100'}`}>
                <Pin size={16} fill={task.isPinned ? "currentColor" : "none"} className={task.isPinned ? "rotate-45" : ""} />
              </button>
            )}
            <button onClick={() => toggleTaskStatus(task)} className={`mr-3 shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}>
              {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <div 
              className="flex flex-col truncate cursor-pointer group/title"
              onClick={() => setViewingTask(task)} // <--- Khi click sẽ mở Drawer
            >
              <span className={`text-sm font-semibold truncate transition-colors group-hover/title:text-blue-600 ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.title}
              </span>
              {task.content && <span className="text-xs text-gray-400 truncate mt-0.5">{task.content}</span>}
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <div className="w-[80px] flex justify-center"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-500' : task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-500'}`}>{task.priority}</span></div>
            <div className="w-[100px] flex justify-end">{task.dueDate ? <span className="text-[11px] text-gray-400 font-medium flex items-center"><Calendar size={12} className="mr-1.5" />{new Date(task.dueDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}</span> : <span className="text-[11px] text-gray-300 italic">-</span>}</div>
            <div className="w-[100px] flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingTask(task); setTitle(task.title); setContent(task.content || ""); setPriority(task.priority); setDueDate(task.dueDate ? task.dueDate.split('T')[0] : ""); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white shadow-sm border border-gray-100"><Edit2 size={14} /></button>
              <button onClick={() => { setParentIdForNewTask(task.id); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white shadow-sm border border-gray-100"><Plus size={14} /></button>
              <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-white shadow-sm border border-gray-100"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
        <div className="flex flex-col">{sortedChildren.map(sub => <TaskRow key={sub.id} task={sub} depth={depth + 1} />)}</div>
      </div>
    );
  };

  const rootTasks = tasks.filter(t => !t.parentId);
  const pinned = rootTasks.filter(t => t.isPinned);
  const unpinned = rootTasks.filter(t => !t.isPinned);
  const finalTasks = [...getSortedTasks(pinned), ...getSortedTasks(unpinned)];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{tasks.length} NHIỆM VỤ</span>
        <div className="flex items-center space-x-2 bg-white border px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Sắp xếp:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer">
            <option value="createdAt">Mới nhất</option>
            <option value="dueDate">Hạn chót</option>
            <option value="priority">Độ ưu tiên</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-20">
        {finalTasks.map(t => <TaskRow key={t.id} task={t} depth={0} />)}
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 right-10 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-30">
        <Plus size={30} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="flex-1 p-8 border-r border-gray-100 flex flex-col">
              <input className="w-full text-2xl font-bold text-gray-800 placeholder:text-gray-300 outline-none mb-4" placeholder="Tên nhiệm vụ..." required value={title} onChange={e => setTitle(e.target.value)} />
              <textarea className="w-full text-gray-600 placeholder:text-gray-400 outline-none min-h-[150px] resize-none flex-1" placeholder="Ghi chú chi tiết..." value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div className="w-full md:w-72 bg-gray-50 flex flex-col">
              <div className="p-6 flex-1 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Độ ưu tiên</label>
                  <div className="flex flex-col gap-2">
                    {['high', 'medium', 'low'].map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p)} className={`px-3 py-2 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-between border ${priority === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>
                        {p}{priority === p && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Hạn chót</label>
                  <input type="date" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="p-6 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
                <button type="button" onClick={closeModal} className="text-gray-400 font-bold text-sm">HỦY</button>
                <button onClick={handleSubmit} className="bg-blue-600 text-white py-2 px-6 rounded-xl font-bold text-sm shadow-lg shadow-blue-100">LƯU LẠI</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* THANH TRƯỢT CHI TIẾT */}
      <TaskDetailDrawer 
        task={viewingTask} 
        onClose={() => setViewingTask(null)} 
        onToggleStatus={toggleTaskStatus} 
      />
    </>
  );
}