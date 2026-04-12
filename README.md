# TeamSync - Giải pháp Quản lý Dự án B2B SaaS

**TeamSync** là một nền tảng quản trị công việc và dự án hiện đại dành cho doanh nghiệp, được xây dựng trên mô hình phần mềm dịch vụ (SaaS). Dự án tập trung vào khả năng **Tích hợp các hệ thống tin doanh nghiệp** và **Tự động hóa quy trình làm việc**.

---

## 🚀 Tính năng trọng tâm (Integrated Systems)

Dự án nhấn mạnh vào khả năng liên kết với các dịch vụ bên thứ ba để tạo nên một hệ sinh thái thông tin thống nhất:

1.  **Xác thực tập trung (Identity Integration):** Tích hợp với Google OAuth 2.0 để định danh người dùng an toàn.
2.  **Lưu trữ đám mây (Cloud Storage):** Kết nối với hệ thống Cloudinary để quản lý tệp tin đính kèm phân tán, hỗ trợ Preview đa định dạng.
3.  **Tự động hóa thông báo (Communication Gateway):**
    *   **Email (SMTP):** Tự động gửi email thông báo khi có biến động Task.
    *   **Discord Webhook:** Đẩy thông báo thời gian thực sang nhóm chat cộng tác.
4.  **Lập lịch thông minh (Task Scheduler):** Sử dụng Cronjob để tự động quét và gửi báo cáo nhắc việc vào 8h sáng hàng ngày qua Discord.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

*   **Frontend:** React.js, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query.
*   **Backend:** Node.js, Express.js, TypeScript.
*   **Database:** MongoDB (Mongoose ODM).
*   **DevOps/Automation:** node-cron, Axios, Passport.js.

---

## ⚙️ Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
*   Node.js phiên bản 16.x trở lên.
*   Tài khoản MongoDB Atlas (hoặc MongoDB Local).
*   Tài khoản Google Cloud (để lấy OAuth ID).
*   Tài khoản Cloudinary & Discord Webhook.

### 2. Cấu hình Backend
*   Di chuyển vào thư mục backend: `cd backend`
*   Cài đặt thư viện: `npm install`
*   Tạo tệp `.env` dựa trên định dạng mẫu sau:
```env
PORT=8000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
SESSION_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
FRONTEND_ORIGIN=http://localhost:5173
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_app_password
# Storage & Integration
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
DISCORD_WEBHOOK_URL=your_webhook_url
```
*   Khởi chạy: `npm run dev`

### 3. Cấu hình Frontend
*   Di chuyển vào thư mục client: `cd client`
*   Cài đặt thư viện: `npm install`
*   Tạo tệp `.env.local` (nếu cần cấu hình riêng cho Vite).
*   Khởi chạy: `npm run dev`

---

## 📖 Cấu trúc dự án

```
.
├── backend                 # Node.js Server
│   ├── src
│   │   ├── controllers     # Xử lý Logic nghiệp vụ
│   │   ├── cron            # Hệ thống Tự động hóa (Cronjobs)
│   │   ├── models          # Cấu trúc CSDL (Schemas)
│   │   ├── services        # Tích hợp dịch vụ (Mailer, Cloudinary)
│   │   └── routes          # Hệ thống API Endpoints
├── client                  # React Application
│   ├── src
│   │   ├── components      # Giao diện người dùng
│   │   ├── hooks           # Logic tái sử dụng & API calls
│   │   └── pages           # Các trang chính của dự án
```

---

## 👔 Thông tin thực tập (IIS)

Dự án này được thiết kế để chứng minh khả năng:
*   Phát triển hệ thống theo kiến trúc Client-Server.
*   Tích hợp đa dịch vụ thông qua API (Identity, Cloud Storage, Messaging).
*   Áp dụng các mô hình xử lý bất đồng bộ và tự động hóa tác vụ ngầm.
