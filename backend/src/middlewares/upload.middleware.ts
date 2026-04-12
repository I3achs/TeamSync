import multer from "multer";
import { BadRequestException } from "../utils/appError";

const storage = multer.memoryStorage(); // Lưu vào RAM thay vì đĩa cứng để dễ dàng stream qua Cloudinary

const fileFilter = (req: any, file: any, cb: any) => {
  // Chỉ chấp nhận hình ảnh và tài liệu PDF, DOCX, ZIP cơ bản
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException("File format is not supported"), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter,
});
