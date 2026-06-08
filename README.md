# 🚀 OmniDash - Workspace Automation & Task Management

**OmniDash** là một hệ thống quản lý công việc và tự động hóa không gian làm việc, được xây dựng theo kiến trúc Nguyên khối phân lớp (Layered Monolith). Hệ thống kết hợp giữa Web Application và Browser Extension giúp người dùng lưu trữ công việc và khởi tạo môi trường làm việc (mở hàng loạt tab trình duyệt) chỉ với một cú nhấp chuột.

---

## ✨ Tính năng nổi bật (Key Features)

- **🔐 Xác thực bảo mật:** Đăng nhập, đăng ký an toàn với JWT (JSON Web Token) và mật khẩu được băm bằng bcrypt.
- **📝 Quản lý công việc (Task Management):** Thêm, sửa, xóa và đánh dấu hoàn thành công việc. Gắn kết công việc với từng Không gian làm việc cụ thể.
- **🗂️ Quản lý Không gian làm việc (Workspace Combos):** Tạo các nhóm tài nguyên (URLs) phục vụ cho từng mục đích công việc.
- **⚡ Tự động hóa trình duyệt (Browser Automation):** Giao tiếp bảo mật (Message Passing) giữa Web và Extension để tự động mở hàng loạt trang web mà không bị trình duyệt chặn (Pop-up block).
- **🎨 Giao diện tối giản (Minimalist UI):** Thiết kế trực quan, thân thiện, lấy sự tập trung của người dùng làm trung tâm.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend (Web Client)
- **Framework:** Next.js (React)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS
- **Quản lý trạng thái:** Zustand

### Backend (API Server)
- **Môi trường:** Node.js
- **Framework:** Express.js
- **Kiến trúc:** Layered Monolith (Controller - Service - Repository)
- **Bảo mật:** JWT, bcrypt

### Database (Cơ sở dữ liệu)
- **Hệ quản trị:** PostgreSQL
- **ORM:** Prisma Client

### Browser Extension
- **Chuẩn phát triển:** Manifest V3 (Chrome Extension API)
- **Giao tiếp:** `window.postMessage`, `chrome.runtime`, `chrome.tabs`

---

## ⚙️ Hướng dẫn cài đặt (Installation & Setup)

### Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (Phiên bản LTS)
- [PostgreSQL](https://www.postgresql.org/) (Đang chạy ở cổng 5432)
- Trình duyệt Google Chrome, Edge hoặc Brave.

### Cài đặt Cơ sở dữ liệu và Backend
Mở terminal và di chuyển vào thư mục `backend`:

```bash
cd backend

# Cài đặt thư viện
npm install

# Tạo file .env dựa trên file .env.example
cp .env.example .env

# Chạy Prisma migration để tạo bảng trong PostgreSQL
npx prisma migrate dev --name init

# Khởi chạy server Backend (Mặc định: http://localhost:5000)
npm run dev
