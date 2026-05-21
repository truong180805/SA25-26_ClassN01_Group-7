"use client";

import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardOverviewPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
        Tổng quan
      </h1>
      <p className="text-sm text-gray-500 font-medium mb-10">
        Chào mừng bạn quay trở lại. Đây là bảng tóm tắt công việc của bạn.
      </p>

      {/* Khu vực chứa nội dung Tổng quan (Thống kê, biểu đồ...) sau này bạn code vào đây */}
      <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-xl font-bold text-gray-400">Nội dung trang Tổng quan sẽ nằm ở đây</h2>
      </div>
    </div>
  );
}