"use client";

import { X, Calendar, Flag, Paperclip, CheckCircle2, Circle, Clock, Download, ListTree, Edit2, Trash2, ArrowLeft } from "lucide-react";

interface Task {
  id: string; title: string; content: string | null;
  priority: string; dueDate: string | null;
  isCompleted: boolean; createdAt: string; parentId: string | null; 
  isPinned: boolean;
  dependsOnId?: string | null; // Thêm vào để đồng bộ an toàn
}

interface TaskDetailDrawerProps {
  task: Task | null;
  allTasks?: Task[]; 
  onClose: () => void;
  onToggleStatus: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onViewSubtask?: (task: Task) => void;
  showSubtasks?: boolean; // CÔNG TẮC AN TOÀN (Mặc định tắt để bảo vệ List View)
}

export default function TaskDetailDrawer({ 
  task, allTasks = [], onClose, onToggleStatus, onEdit, onDelete, onViewSubtask, showSubtasks = false 
}: TaskDetailDrawerProps) {
  if (!task) return null;

  const subTasks = allTasks.filter(t => t.parentId === task.id);

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={onClose}></div>

      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col animate-in slide-in-from-right">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            {task.parentId && onViewSubtask && showSubtasks && (
              <button onClick={() => {
                const parent = allTasks.find(t => t.id === task.parentId);
                if(parent) onViewSubtask(parent);
              }} className="p-1.5 hover:bg-white rounded-md border border-gray-200 text-gray-500 shadow-sm mr-2" title="Quay lại Task cha">
                <ArrowLeft size={16} />
              </button>
            )}
            
            <button onClick={() => onToggleStatus(task)} className={`${task.isCompleted ? 'text-green-500' : 'text-gray-400 hover:text-green-500'} transition-colors`}>
              {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {task.isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button onClick={() => onEdit(task)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-full transition-colors" title="Sửa công việc">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <h2 className={`text-2xl font-black mb-6 ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h2>

          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 flex items-center"><Flag size={16} className="mr-2"/> Độ ưu tiên</span>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-md ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'}`}>{task.priority}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 flex items-center"><Calendar size={16} className="mr-2"/> Hạn chót</span>
              <span className="text-sm font-bold text-gray-800">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : <span className="text-gray-400 italic">-</span>}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Mô tả công việc</h3>
            {task.content ? (
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">{task.content}</div>
            ) : <p className="text-gray-400 italic text-sm">Chưa có mô tả chi tiết.</p>}
          </div>

          {/* CHỈ HIỆN TASK CON NẾU CÔNG TẮC BẬT (Bảo vệ an toàn cho List View) */}
          {showSubtasks && subTasks.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center"><ListTree size={16} className="mr-2"/> Nhiệm vụ con</h3>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                {subTasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                      <button onClick={() => onToggleStatus(sub)} className={sub.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}>
                        {sub.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <span 
                        onClick={() => onViewSubtask && onViewSubtask(sub)} 
                        className={`text-sm font-medium truncate cursor-pointer hover:text-blue-600 transition-colors ${sub.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                      >
                        {sub.title}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2 shrink-0">
                      {onEdit && <button onClick={() => onEdit(sub)} className="text-gray-500 hover:text-blue-600 p-1.5 bg-white border border-gray-200 rounded shadow-sm" title="Sửa"><Edit2 size={14}/></button>}
                      {onDelete && <button onClick={() => onDelete(sub.id)} className="text-gray-500 hover:text-red-500 p-1.5 bg-white border border-gray-200 rounded shadow-sm" title="Xóa"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center"><Paperclip size={16} className="mr-2" /> Minh chứng</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"><Download size={24} /></div>
              <p className="text-sm font-bold text-gray-600">Kéo thả file vào đây</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}