import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { BadRequestException } from "../utils/appError";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
} from "../validation/task.validation";
import { projectIdSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import {
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  updateTaskService,
  uploadAttachmentService,
  deleteAttachmentService,
} from "../services/task.service";
import { HTTPSTATUS } from "../config/http.config";

export const createTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = createTaskSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(
      workspaceId,
      projectId,
      userId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Tạo công việc thành công",
      task,
    });
  }
);

export const updateTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = updateTaskSchema.parse(req.body);

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { updatedTask } = await updateTaskService(
      workspaceId,
      projectId,
      taskId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Cập nhật công việc thành công",
      task: updatedTask,
    });
  }
);

export const getAllTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const filters = {
      projectId: req.query.projectId as string | undefined,
      status: req.query.status
        ? (req.query.status as string)?.split(",")
        : undefined,
      priority: req.query.priority
        ? (req.query.priority as string)?.split(",")
        : undefined,
      assignedTo: req.query.assignedTo
        ? (req.query.assignedTo as string)?.split(",")
        : undefined,
      keyword: req.query.keyword as string | undefined,
      dueDate: req.query.dueDate as string | undefined,
    };

    const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllTasksService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "Lấy danh sách công việc thành công",
      ...result,
    });
  }
);

export const getTaskByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(workspaceId, projectId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Tải công việc thành công",
      task,
    });
  }
);

export const deleteTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);

    await deleteTaskService(workspaceId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Xóa công việc thành công",
    });
  }
);

export const uploadAttachmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const file = req.file;
    if (!file) {
      throw new BadRequestException("Không tìm thấy tệp đính kèm");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await uploadAttachmentService(
      workspaceId,
      projectId,
      taskId,
      file
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Tải lên tệp thành công",
      task,
    });
  }
);

export const deleteAttachmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    
    // public_id can contain slashes so it's safer to pass it in body
    const publicId = req.body.publicId;

    if (!publicId) {
      throw new BadRequestException("Public ID is required");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await deleteAttachmentService(
      workspaceId,
      projectId,
      taskId,
      publicId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Gỡ tệp đính kèm thành công",
      task,
    });
  }
);
