import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  uploadAttachmentController,
  deleteAttachmentController,
} from "../controllers/task.controller";
import { upload } from "../middlewares/upload.middleware";

const taskRoutes = Router();

taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController);

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);

taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

taskRoutes.post(
  "/:id/project/:projectId/workspace/:workspaceId/upload",
  upload.single("file"), // expecting form-data with key 'file'
  uploadAttachmentController
);

taskRoutes.post(
  "/:id/project/:projectId/workspace/:workspaceId/attachment/delete",
  deleteAttachmentController
);

export default taskRoutes;
