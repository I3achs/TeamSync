import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import UserModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { sendEmail } from "./mailer.service";
import { taskNotificationTemplate } from "../utils/emailTemplates";

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const { title, description, priority, status, assignedTo, dueDate } = body;

  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }
  if (assignedTo) {
    const isAssignedUserMember = await MemberModel.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }
  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
  });

  await task.save();

  // ----- THÔNG BÁO EMAIL: KHI TẠO CÔNG VIỆC MỚI -----
  if (assignedTo) {
    const assignedUser = await UserModel.findById(assignedTo);
    if (assignedUser && assignedUser.email) {
      const emailHtml = taskNotificationTemplate(
        "Có công việc mới được giao cho bạn",
        `Xin chào <b>${assignedUser.name}</b>, một công việc mới vừa được giao cho bạn trong dự án <b>${project.name}</b>.`,
        `<strong>Tên công việc:</strong> ${title}<br/>
         <strong>Mức độ ưu tiên:</strong> ${priority || TaskPriorityEnum.MEDIUM}<br/>
         <strong>Mô tả:</strong> ${description || "Không có"}`,
         // Add full base frontend url from env or hardcode locally for now (app config)
        `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/workspace/${workspaceId}/project/${projectId}`
      );

      // Chạy nền không block main thread
      sendEmail({
        to: assignedUser.email,
        subject: `[TeamSync] Công việc mới: ${title}`,
        html: emailHtml,
      }).catch((err) => console.error("Lỗi gửi email tạo task:", err));
    }
  }

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  // ----- THÔNG BÁO EMAIL: KHI CẬP NHẬT CÔNG VIỆC -----
  const oldAssigneeStr = task.assignedTo ? task.assignedTo.toString() : null;
  const newAssigneeStr = updatedTask.assignedTo ? updatedTask.assignedTo.toString() : null;

  // 1. Xử lý thông báo chuyển/thay đổi người phụ trách
  if (oldAssigneeStr !== newAssigneeStr) {
    // Thông báo cho người cũ (Nếu trước đó có người được giao)
    if (oldAssigneeStr) {
      const oldUser = await UserModel.findById(oldAssigneeStr);
      if (oldUser && oldUser.email) {
        const emailHtml = taskNotificationTemplate(
          "Bạn không còn phụ trách công việc",
          `Xin chào <b>${oldUser.name}</b>, công việc <b>${task.title}</b> đã được chuyển cho người khác phụ trách.`,
          `<strong>Tên công việc:</strong> ${task.title}`,
          `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/workspace/${workspaceId}/project/${projectId}`
        );
        sendEmail({ to: oldUser.email, subject: `[TeamSync] Hủy giao việc: ${task.title}`, html: emailHtml }).catch(console.error);
      }
    }

    // Thông báo cho người mới (Nếu có người mới được giao)
    if (newAssigneeStr) {
      const newUser = await UserModel.findById(newAssigneeStr);
      if (newUser && newUser.email) {
        const emailHtml = taskNotificationTemplate(
          "Cập nhật người phụ trách",
          `Xin chào <b>${newUser.name}</b>, công việc <b>${updatedTask.title}</b> vừa được chuyển cho bạn phụ trách.`,
          `<strong>Tên công việc:</strong> ${updatedTask.title}<br/>
           <strong>Mức độ ưu tiên:</strong> ${updatedTask.priority}<br/>
           <strong>Hạn chót:</strong> ${updatedTask.dueDate ? new Date(updatedTask.dueDate).toLocaleDateString("vi-VN") : "Không có"}`,
          `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/workspace/${workspaceId}/project/${projectId}`
        );
        sendEmail({ to: newUser.email, subject: `[TeamSync] Giao việc cập nhật: ${updatedTask.title}`, html: emailHtml }).catch(console.error);
      }
    }
  }

  // 2. Xử lý thay đổi các thuộc tính khác (nếu Người phụ trách KHÔNG THAY ĐỔI và TỒN TẠI)
  if (oldAssigneeStr === newAssigneeStr && newAssigneeStr) {
    const assignedUser = await UserModel.findById(newAssigneeStr);
    if (assignedUser && assignedUser.email) {
      let changesLog = "";
      if (task.title !== updatedTask.title) changesLog += `<li><strong>Tiêu đề:</strong> <del>${task.title}</del> &rarr; ${updatedTask.title}</li>`;
      if (task.status !== updatedTask.status) changesLog += `<li><strong>Trạng thái:</strong> <del>${task.status}</del> &rarr; ${updatedTask.status}</li>`;
      if (task.priority !== updatedTask.priority) changesLog += `<li><strong>Ưu tiên:</strong> <del>${task.priority}</del> &rarr; ${updatedTask.priority}</li>`;
      
      const oldDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "Không có";
      const newDate = updatedTask.dueDate ? new Date(updatedTask.dueDate).toLocaleDateString("vi-VN") : "Không có";
      if (oldDate !== newDate) changesLog += `<li><strong>Hạn chót:</strong> <del>${oldDate}</del> &rarr; ${newDate}</li>`;

      if (changesLog !== "") {
        const emailHtml = taskNotificationTemplate(
          "Cập nhật công việc",
          `Xin chào <b>${assignedUser.name}</b>, công việc <b>${updatedTask.title}</b> mà bạn đang phụ trách vừa có một thay đổi.`,
          `<ul>${changesLog}</ul>`,
          `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/workspace/${workspaceId}/project/${projectId}`
        );

        sendEmail({
          to: assignedUser.email,
          subject: `[TeamSync] Cập nhật công việc: ${updatedTask.title}`,
          html: emailHtml,
        }).catch((err) => console.error("Lỗi gửi email cập nhật task:", err));
      }
    }
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  //Pagination Setup
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture -password")
      .populate("project", "_id emoji name"),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  }).populate("assignedTo", "_id name profilePicture -password");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  // ----- THÔNG BÁO EMAIL: KHI XÓA CÔNG VIỆC -----
  if (task.assignedTo) {
    const assignedUser = await UserModel.findById(task.assignedTo);
    if (assignedUser && assignedUser.email) {
      const emailHtml = taskNotificationTemplate(
        "Công việc đã bị xóa",
        `Xin chào <b>${assignedUser.name}</b>, công việc <b>${task.title}</b> mà bạn đang phụ trách vừa bị xóa khỏi hệ thống.`,
        `<strong>Tên công việc:</strong> ${task.title}<br/><strong>Mã công việc:</strong> ${task.taskCode}`,
        `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/workspace/${workspaceId}`
      );

      sendEmail({
        to: assignedUser.email,
        subject: `[TeamSync] Công việc bị xóa: ${task.title}`,
        html: emailHtml,
      }).catch((err) => console.error("Lỗi gửi email xóa task:", err));
    }
  }

  return;
};

export const uploadAttachmentService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  file: Express.Multer.File
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  // Upload to Cloudinary using stream
  const cloudinary = require("../config/cloudinary.config").default;
  const path = require("path");

  const isImage = file.mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw"; // PDF and office documents must be raw
  
  // Combine timestamp with filename to avoid overwrite
  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
  
  // For 'raw', Cloudinary needs the extension in public_id to serve the correct Content-Type (e.g. application/pdf)
  // For 'image', we omit it.
  const publicId = isImage 
    ? `${baseName}_${Date.now()}` 
    : `${baseName}_${Date.now()}${ext}`; 

  const uploadResult: any = await new Promise((resolve, reject) => {
    const options: any = {
      folder: "teamsync/tasks",
      resource_type: resourceType,
      public_id: publicId,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  const attachment = {
    url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    name: file.originalname,
  };

  task.attachments = task.attachments || [];
  task.attachments.push(attachment);
  await task.save();

  return { task };
};

export const deleteAttachmentService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  publicId: string
) => {
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  });

  if (!task) {
    throw new NotFoundException("Task not found or access denied");
  }

  // Tìm attachment tương ứng
  const attachmentIndex = task.attachments?.findIndex(
    (att) => att.public_id === publicId
  );

  if (attachmentIndex === undefined || attachmentIndex === -1) {
    throw new NotFoundException("Attachment not found");
  }

  // Gọi Cloudinary xóa file trên cloud
  const cloudinary = require("../config/cloudinary.config").default;
  try {
    // Determine the resource_type. Since we set it to 'raw' if it had an extension during our custom upload...
    // Actually, Cloudinary destroy needs the resource_type if it's not an image.
    // If publicId contains an extension, it's likely a raw file based on our earlier logic.
    const hasExtension = publicId.match(/\.[0-9a-z]+$/i);
    const resourceType = hasExtension ? "raw" : "image";
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("Cloudinary failed to delete attachment:", error);
    // Vẫn tiêp tục để xóa trong DB
  }

  // Xóa file khỏi mảng attachments
  task.attachments!.splice(attachmentIndex, 1);
  await task.save();

  return { task };
};

