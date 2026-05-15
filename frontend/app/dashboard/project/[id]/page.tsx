"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft } from "lucide-react";
import TaskListView from "@/app/components/TaskListView";
import TaskSequenceView from "@/app/components/TaskSequenceView";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProjectData();
      fetchTasks();
    }
  }, [projectId, token]);

  const fetchProjectData = async () => {
    try {
      const decoded: any = jwtDecode(token!);
      const res = await fetch(`http://localhost:5000/api/projects/${decoded.userId}`);
      const projects = await res.json();
      const current = projects.find((p: any) => p.id === projectId);
      setProject(current);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
      setTasks(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading || !project) return <div className="p-20 text-center">Đang tải dự án...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={22} /></button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">{project.title}</h1>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">
                Chế độ: {project.viewType === 'sequence' ? 'Sơ đồ tuần tự' : 'Danh sách'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-10">
        {project.viewType === 'sequence' ? (
          <TaskSequenceView tasks={tasks} onRefresh={fetchTasks} projectId={projectId} isStrictSequence={project.isStrictSequence}/>
        ) : (
          <TaskListView tasks={tasks} onRefresh={fetchTasks} projectId={projectId} userId={jwtDecode<any>(token!).userId} />
        )}
      </main>
    </div>
  );
}