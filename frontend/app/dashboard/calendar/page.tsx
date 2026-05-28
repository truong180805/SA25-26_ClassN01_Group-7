"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../store/useAuthStore";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  CheckCircle2, Clock, X, LayoutGrid, List as ListIcon,
  ExternalLink
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  endDate: string | null;
  isCompleted: boolean;
  priority: string;
  projectId: string;
  project?: { title: string };
}

export default function CalendarPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateInfo, setSelectedDateInfo] = useState<{ date: Date, tasks: Task[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchTasks = async () => {
      try {
        const decoded: any = jwtDecode(token);
        const res = await fetch(`http://localhost:5000/api/tasks/user/${decoded.userId}`);
        if (res.ok) setTasks(await res.json());
      } catch (err) { console.error("Lỗi tải Task:", err); } 
      finally { setLoading(false); }
    };
    fetchTasks();
  }, [token]);

  // ==========================================
  // LOGIC TÍNH TOÁN LỊCH
  // ==========================================
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const goNext = () => {
    if (viewMode === "month") setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const goPrev = () => {
    if (viewMode === "month") setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const jumpToToday = () => setCurrentDate(new Date());

  const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return dateToCheck.getDate() === today.getDate() && 
           dateToCheck.getMonth() === today.getMonth() && 
           dateToCheck.getFullYear() === today.getFullYear();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      if (!t.endDate) return false;
      const d = new Date(t.endDate);
      return isSameDay(d, date);
    });
  };

  const getPriorityColor = (priority: string, isCompleted: boolean) => {
    if (isCompleted) return "bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70";
    switch (priority) {
      case 'high': return "bg-red-50 text-red-700 border-red-100 shadow-sm";
      case 'medium': return "bg-yellow-50 text-yellow-700 border-yellow-100 shadow-sm";
      default: return "bg-blue-50 text-blue-700 border-blue-100 shadow-sm";
    }
  };

  const handleDayClick = (date: Date, dayTasks: Task[]) => setSelectedDateInfo({ date, tasks: dayTasks });
  const navigateToProject = (projectId: string) => router.push(`/dashboard/project/${projectId}`);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8 animate-in fade-in duration-500 flex flex-col h-full">
      
      {/* HEADER LỊCH & ĐIỀU HƯỚNG */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <CalendarIcon className="mr-3 text-blue-600" size={32} /> Lịch trình công việc
          </h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi hạn chót và quản lý thời gian hiệu quả.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button onClick={() => setViewMode("month")} className={`flex-1 sm:w-32 flex items-center justify-center px-4 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <LayoutGrid size={16} className="mr-2" /> Tháng
            </button>
            <button onClick={() => setViewMode("week")} className={`flex-1 sm:w-32 flex items-center justify-center px-4 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <ListIcon size={16} className="mr-2" /> Tuần
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-full sm:w-auto justify-between">
            <button onClick={jumpToToday} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0">Hôm nay</button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button onClick={goPrev} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
            <span className="w-40 text-center font-black text-gray-800 tracking-wide uppercase text-sm truncate">
              {viewMode === "month" ? `Tháng ${currentMonth + 1} / ${currentYear}` : `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} - ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}`}
            </span>
            <button onClick={goNext} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* KHUNG LỊCH CHÍNH (FIX LỖI MẤT CUỘN TẠI ĐÂY) */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        
        {/* Tiêu đề Thứ (Cố định không bị cuộn) */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest border-r border-gray-100 last:border-0">{day}</div>
          ))}
        </div>

        {/* Lưới Ngày (Cho phép cuộn dọc overflow-y-auto) */}
        {viewMode === "month" ? (
          <div className="grid grid-cols-7 bg-gray-200 gap-px flex-1 overflow-y-auto custom-scrollbar">
            {Array.from({ length: adjustedFirstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-50/50 min-h-[120px] p-2"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const dayTasks = getTasksForDate(dateObj);

              return (
                <div 
                  key={day} onClick={() => handleDayClick(dateObj, dayTasks)}
                  className={`bg-white min-h-[120px] p-2 transition-all hover:bg-blue-50/50 cursor-pointer group flex flex-col ${isToday(dateObj) ? 'bg-blue-50/30 ring-inset ring-2 ring-blue-100' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2 shrink-0">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday(dateObj) ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 group-hover:text-blue-600 transition-colors'}`}>{day}</span>
                    {dayTasks.length > 0 && <span className="text-[10px] font-bold text-gray-400 mt-1 mr-1">{dayTasks.length} task</span>}
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-hidden pointer-events-none">
                    {dayTasks.slice(0, 4).map(task => (
                      <div key={task.id} className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${getPriorityColor(task.priority, task.isCompleted)}`}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 4 && <div className="text-[10px] text-gray-400 font-bold px-1">+ {dayTasks.length - 4} tác vụ khác...</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 bg-gray-200 gap-px flex-1 overflow-y-auto custom-scrollbar">
            {weekDays.map((dateObj, index) => {
              const dayTasks = getTasksForDate(dateObj);
              return (
                <div 
                  key={index} onClick={() => handleDayClick(dateObj, dayTasks)}
                  className={`bg-white p-3 flex flex-col transition-all hover:bg-blue-50/30 cursor-pointer min-h-[300px] ${isToday(dateObj) ? 'bg-blue-50/20' : ''}`}
                >
                  <div className="text-center mb-4 pb-2 border-b border-gray-100 shrink-0">
                    <span className={`text-2xl font-black ${isToday(dateObj) ? 'text-blue-600' : 'text-gray-700'}`}>{dateObj.getDate()}</span>
                  </div>
                  <div className="space-y-2 flex-1 pointer-events-none">
                    {dayTasks.length === 0 ? (
                      <div className="text-center text-xs text-gray-300 font-medium italic mt-4">Trống</div>
                    ) : (
                      dayTasks.map(task => (
                        <div key={task.id} className={`text-xs font-bold px-2.5 py-2 rounded-xl border flex flex-col gap-1 ${getPriorityColor(task.priority, task.isCompleted)}`}>
                          <span className="line-clamp-2 leading-tight">{task.title}</span>
                          {task.project && <span className="text-[9px] uppercase tracking-wider opacity-70 truncate mt-1">{task.project.title}</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedDateInfo && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">{isToday(selectedDateInfo.date) ? "Hôm nay" : `Ngày ${selectedDateInfo.date.getDate()}/${selectedDateInfo.date.getMonth() + 1}`}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">{selectedDateInfo.tasks.length} Tác vụ</p>
              </div>
              <button onClick={() => setSelectedDateInfo(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {selectedDateInfo.tasks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                  <h4 className="font-bold text-gray-800">Một ngày thảnh thơi!</h4>
                </div>
              ) : (
                selectedDateInfo.tasks.map(task => (
                  <div key={task.id} onClick={() => navigateToProject(task.projectId)} className={`p-4 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md flex items-start gap-3 ${task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <div className="pt-0.5">{task.isCompleted ? <CheckCircle2 size={20} className="text-green-500" /> : <Clock size={20} className="text-orange-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold line-clamp-2 ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                      {task.project && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">📁 {task.project.title}</p>}
                    </div>
                    <ExternalLink size={16} className="text-gray-300" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}