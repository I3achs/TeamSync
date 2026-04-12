import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { editTaskMutationFn, uploadTaskAttachmentMutationFn, deleteTaskAttachmentMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";

export default function EditTaskForm({ task, onClose }: { task: TaskType; onClose: () => void }) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate, isPending } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const { mutate: uploadMutate, isPending: isUploading } = useMutation({
    mutationFn: uploadTaskAttachmentMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      toast({
        title: "Tải lên thành công",
        description: "Tệp đính kèm đã được thêm vào công việc.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi tải lên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteAttachmentMutate, isPending: isDeletingAttachment } = useMutation({
    mutationFn: deleteTaskAttachmentMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      toast({
        title: "Đã xóa tệp",
        description: "Tệp đính kèm đã được xóa khỏi hệ thống.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Lỗi", description: "Tệp vượt quá 5MB", variant: "destructive" });
        return;
      }
      uploadMutate({ workspaceId, projectId: task.project?._id ?? "", taskId: task._id, file });
    }
  };

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];

  // Members Dropdown Options
  const membersOptions = members.map((member) => ({
    label: member.userId?.name || "Unknown",
    value: member.userId?._id || "",
  }));

  // Status & Priority Options
  const statusOptions = Object.values(TaskStatusEnum).map((status) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    value: status,
  }));

  const priorityOptions = Object.values(TaskPriorityEnum).map((priority) => ({
    label: priority.charAt(0) + priority.slice(1).toLowerCase(),
    value: priority,
  }));

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: "Vui lòng nhập tiêu đề" }),
    description: z.string().trim(),
    status: z.enum(Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum]),
    priority: z.enum(Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum]),
    assignedTo: z.string().trim().min(1, { message: "Vui lòng chọn Người phụ trách" }),
    dueDate: z.date({ required_error: "Vui lòng chọn Hạn chót." }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      assignedTo: task.assignedTo?._id ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    const payload = {
      workspaceId,
      projectId: task.project?._id ?? "",
      taskId: task._id,
      data: {
        ...values,
        dueDate: values.dueDate.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
        toast({
          title: "Thành công",
          description: "Cập nhật Công việc thành công",
          variant: "success",
        });
        onClose();
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl font-semibold text-center sm:text-left">Sửa Công việc</h1>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Tiêu đề Công việc</FormLabel>
                <FormControl><Input {...field} placeholder="Tiêu đề Công việc" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả Công việc</FormLabel>
                <FormControl><Textarea {...field} rows={2} placeholder="Mô tả chi tiết" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Assigned To */}
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Người phụ trách</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn người phụ trách" /></SelectTrigger></FormControl>
                  <SelectContent>
                  <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                    {membersOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Due Date */}
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Hạn chót</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline">
                        {field.value ? format(field.value, "PPP") : "Chọn ngày"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            {/* Status */}
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn Trạng thái" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Priority */}
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Mức độ ưu tiên</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn Mức độ ưu tiên" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending || isUploading}>
              {isPending && <Loader className="animate-spin" />}
              Lưu Thay đổi
            </Button>
          </form>
        </Form>

        <div className="mt-8 pt-4 border-t space-y-4 relative pb-10">
          <h2 className="text-sm font-semibold">Tài liệu đính kèm (Quy mô tối đa: 5MB)</h2>
          
          {task.attachments && task.attachments.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {task.attachments.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                  <a href={file.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    {file.name}
                  </a>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isDeletingAttachment}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa tệp này vĩnh viễn?")) {
                        deleteAttachmentMutate({ workspaceId, projectId: task.project?._id ?? "", taskId: task._id, publicId: file.public_id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground p-2 bg-gray-50 rounded-md">Chưa có tệp nào được đính kèm.</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Input type="file" onChange={handleFileUpload} disabled={isUploading} className="text-xs" />
            {isUploading && <Loader className="animate-spin h-4 w-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}
