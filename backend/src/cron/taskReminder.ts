import cron from "node-cron";
import TaskModel from "../models/task.model";
import axios from "axios";
import { TaskStatusEnum } from "../enums/task.enum";
import ProjectModel from "../models/project.model"; 

const runTaskCheck = async () => {
  try {
    console.log("CronJob: Đang quét các công việc trễ hạn/sắp đến hạn...");

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl === "" || webhookUrl === ".") {
      console.warn("Chưa cấu hình DISCORD_WEBHOOK_URL. Bỏ qua gửi cảnh báo qua Discord.");
      return;
    }

    // Tìm hạn chót trước mặt 24 giờ
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const tasks = await TaskModel.find({
      status: { $ne: TaskStatusEnum.DONE },
      dueDate: { $lte: tomorrow, $ne: null },
    })
      .populate("assignedTo", "name email")
      .populate("project", "name");

    if (!tasks || tasks.length === 0) {
      console.log("CronJob: Tuyệt vời, không có Task nào sắp trễ lỡ hẹn!");
      return;
    }

    for (const task of tasks) {
      const dueDate = new Date(task.dueDate!);
      const isOverdue = dueDate < new Date();
      const assignedUser: any = task.assignedTo;
      const project: any = task.project;

      const embedData = {
        title: isOverdue
          ? `🚨 TRỄ HẠN: ${task.title}`
          : `⚠️ SẮP ĐẾN HẠN (24H): ${task.title}`,
        color: isOverdue ? 15548997 : 16753920, // Đỏ hoặc Cam
        description: `Hãy chú ý đẩy nhanh tiến độ công việc này thuộc dự án **${
          project?.name || "N/A"
        }**!`,
        fields: [
          {
            name: "👤 Người phụ trách",
            value: assignedUser?.name || "Chưa ai nhận",
            inline: true,
          },
          {
            name: "⏰ Hạn chót",
            value: dueDate.toLocaleString("vi-VN"),
            inline: true,
          },
          {
            name: "📊 Trạng thái",
            value: task.status,
            inline: true,
          },
        ],
        footer: { text: "Hệ thống Quản lý Dự án tự động (TeamSync)" },
        timestamp: new Date().toISOString(),
      };

      await axios.post(webhookUrl, {
        username: "TeamSync Bot",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/8646/8646039.png",
        embeds: [embedData],
      });
      // Tránh spam API rate limit Discord
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Lỗi hệ thống CronJob:", error);
  }
};

export const initTaskReminderCron = () => {
  // Lập lịch tự động quét vào lúc 08:00 sáng mỗi ngày
  cron.schedule("0 8 * * *", runTaskCheck);

  // MÔI TRƯỜNG DEV: Để bạn dễ Test nộp bài, tôi sẽ kích hoạt nó chạy thêm 1 lần 
  // vào khoảng 10 giây sau khi Back-end vừa khởi động hoàn tất!
  if (process.env.NODE_ENV === "development") {
    setTimeout(runTaskCheck, 10000);
  }
};
