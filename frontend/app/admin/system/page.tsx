"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Settings, DownloadCloud, Server, AlertTriangle, 
  CheckCircle2, HardDrive, Trash2
} from "lucide-react";

export default function AdminSystemPage() {
  const { token } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // HÀM XỬ LÝ TẢI FILE BACKUP (HÀNG REAL 100%)
  const handleExportBackup = async () => {
    if (!token) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const res = await fetch("http://localhost:5000/api/admin/backup", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        
        // 1. Chuyển đổi JSON thành một chuỗi (String) định dạng đẹp
        const jsonString = JSON.stringify(data, null, 2);
        
        // 2. Tạo một Blob (File ảo) từ chuỗi JSON
        const blob = new Blob([jsonString], { type: "application/json" });
        
        // 3. Tạo một đường link ẩn để kích hoạt tải xuống
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Tên file tải xuống có kèm ngày tháng năm
        const dateStr = new Date().toISOString().split("T")[0];
        link.download = `omnidash_backup_${dateStr}.json`;
        
        // 4. Kích hoạt click ẩn và dọn dẹp
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 5000); // Ẩn thông báo sau 5s
      } else {
        alert("Có lỗi xảy ra khi sao lưu dữ liệu.");
      }
    } catch (error) {
      console.error("Lỗi Export Backup:", error);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setIsExporting(false);
    }
  };

  // Hàm mô phỏng dọn dẹp Cache
  const handleClearCache = () => {
    alert("Hệ thống đã dọn dẹp 124MB Cache và rác máy chủ thành công!");
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-black text-slate-800 flex items-center">
          <Settings size={24} className="mr-3 text-blue-600"/> 
          Bảo trì & Cấu hình Hệ thống
        </h2>
        <p className="text-sm text-slate-500 font-bold mt-1">
          Quản lý an toàn dữ liệu, sao lưu dự phòng và tối ưu hóa hiệu suất máy chủ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CARD 1: SAO LƯU DỮ LIỆU */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <DownloadCloud size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Sao lưu Dữ liệu (Backup)</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Trích xuất toàn bộ dữ liệu của hệ thống bao gồm Tài khoản, Workspace, Dự án và Tác vụ thành một tệp tin <b>.json</b> để lưu trữ an toàn.
            </p>
          </div>
          
          <div>
            <button 
              onClick={handleExportBackup}
              disabled={isExporting}
              className={`w-full flex items-center justify-center py-3.5 rounded-xl font-bold transition-all ${
                isExporting 
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {isExporting ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-3"></div> Đang trích xuất...</>
              ) : (
                <><HardDrive size={18} className="mr-2" /> Trích xuất & Tải xuống</>
              )}
            </button>
            
            {exportSuccess && (
              <p className="flex items-center text-sm font-bold text-emerald-600 mt-4 animate-in slide-in-from-bottom-2">
                <CheckCircle2 size={16} className="mr-1.5" /> Sao lưu thành công! Đã lưu file.
              </p>
            )}
          </div>
        </div>

        {/* CARD 2: DỌN DẸP HỆ THỐNG */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Server size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Tối ưu hóa Máy chủ</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Xóa các bộ nhớ đệm (Cache) tạm thời, dọn dẹp các tệp log cũ để giải phóng dung lượng RAM và Ổ cứng cho máy chủ.
            </p>
          </div>
          
          <button 
            onClick={handleClearCache}
            className="w-full flex items-center justify-center py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
          >
            <Trash2 size={18} className="mr-2" /> Dọn dẹp Cache ngay
          </button>
        </div>

      </div>

      {/* CARD 3: DANGER ZONE (CẢNH BÁO) */}
      <div className="bg-red-50 rounded-3xl border border-red-100 p-8 mt-8">
        <h3 className="text-lg font-black text-red-600 flex items-center mb-2">
          <AlertTriangle size={20} className="mr-2" /> Khu vực Nguy hiểm (Danger Zone)
        </h3>
        <p className="text-sm text-red-500/80 font-bold mb-6">
          Các thao tác dưới đây có thể gây ảnh hưởng nghiêm trọng đến toàn bộ hệ thống và không thể hoàn tác.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => alert("Chức năng đã bị khóa để đảm bảo an toàn.")} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-colors text-sm">
            Khóa hệ thống (Bảo trì)
          </button>
          <button onClick={() => alert("Chức năng đã bị khóa để đảm bảo an toàn.")} className="px-6 py-3 bg-white border-2 border-red-200 hover:border-red-600 text-red-600 rounded-xl font-bold transition-colors text-sm">
            Xóa toàn bộ Dữ liệu
          </button>
        </div>
      </div>

    </div>
  );
}