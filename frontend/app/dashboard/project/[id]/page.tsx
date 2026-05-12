// app/dashboard/project/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Quay lại danh sách
      </button>

      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Nội dung chi tiết Công việc</h1>
        <p className="text-gray-500">ID dự án: <span className="font-mono text-blue-600">{projectId}</span></p>
        <div className="mt-10 py-20 border-2 border-dashed rounded-2xl text-gray-300">
          Giao diện Nhiệm vụ (Task & Sub-task) sẽ được xây dựng tại đây ở bước tiếp theo.
        </div>
      </div>
    </div>
  );
}