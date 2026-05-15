"use client";

import { X, Calendar, Flag, Paperclip, CheckCircle2, Circle, Clock, Download } from "lucide-react";

interface Task {
  id: string; title: string; content: string | null;
  priority: string; dueDate: string | null;
  isCompleted: boolean; createdAt: string;parentId: string | null; 
  isPinned: boolean;
}

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onToggleStatus: (task: Task) => void;
}

export default function TaskDetailDrawer({ task, onClose, onToggleStatus }: TaskDetailDrawerProps) {
  if (!task) return null;

  return (
    <>
      {/* Lớp nền mờ tối (Click vào đây cũng sẽ đóng thanh trượt) */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Thanh trượt từ bên phải vào */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col animate-in slide-in-from-right">
        
        {/* Header Thanh trượt */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <button onClick={() => onToggleStatus(task)} className={`${task.isCompleted ? 'text-green-500' : 'text-gray-400 hover:text-green-500'} transition-colors`}>
              {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {task.isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Nội dung chính cuộn được */}
        <div className="flex-1 overflow-y-auto p-8">
          <h2 className={`text-2xl font-black mb-6 ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h2>

          {/* Hộp thuộc tính */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 flex items-center"><Flag size={16} className="mr-2"/> Độ ưu tiên</span>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-md ${
                task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
              }`}>{task.priority}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 flex items-center"><Calendar size={16} className="mr-2"/> Hạn chót</span>
              <span className="text-sm font-bold text-gray-800">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : <span className="text-gray-400 italic">Không có</span>}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 flex items-center"><Clock size={16} className="mr-2"/> Ngày tạo</span>
              <span className="text-sm font-medium text-gray-500">
                {new Date(task.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Phần Nội dung / Mô tả */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Mô tả công việc</h3>
            {task.content ? (
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                {task.content}
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">Chưa có mô tả chi tiết cho nhiệm vụ này.</p>
            )}
          </div>

          {/* Phần Minh chứng / File đính kèm (Giao diện chờ cho tương lai) */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
              <Paperclip size={16} className="mr-2" /> Minh chứng / Đính kèm
            </h3>
            
            {/* Đây là giao diện giả lập (Mock UI) chờ Backend xử lý File sau này */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <p className="text-sm font-bold text-gray-600">Kéo thả file minh chứng vào đây</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ PDF, Hình ảnh, Word (Tối đa 5MB)</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}