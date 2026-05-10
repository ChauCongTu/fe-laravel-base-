/**
 * Yup schemas dùng chung cho toàn app.
 */
import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
  password: yup.string().required("Vui lòng nhập mật khẩu"),
});

export const registerSchema = yup.object({
  name: yup.string().required("Vui lòng nhập họ tên"),
  email: yup
    .string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
  password: yup
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .required("Vui lòng nhập mật khẩu"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
});

export const changePasswordSchema = yup.object({
  current_password: yup.string().required("Vui lòng nhập mật khẩu hiện tại"),
  password: yup
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .required("Vui lòng nhập mật khẩu mới"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});

export const updateProfileSchema = yup.object({
  name: yup.string().max(255).optional(),
  user_name: yup.string().max(50).optional(),
  email: yup.string().email("Email không hợp lệ").max(255).optional(),
  phone: yup.string().max(20).nullable().optional(),
  nationality: yup.string().max(100).nullable().optional(),
  city: yup.string().max(100).nullable().optional(),
  address: yup.string().max(500).nullable().optional(),
  gender: yup
    .string()
    .oneOf(["male", "female", "other", "prefer_not_to_say", ""])
    .nullable()
    .optional(),
});

export const folderSchema = yup.object({
  name: yup.string().max(255).required("Vui lòng nhập tên thư mục"),
  color: yup
    .string()
    .nullable()
    .matches(/^#[0-9A-Fa-f]{6}$/, "Màu không hợp lệ")
    .optional(),
  icon: yup.string().nullable().max(50).optional(),
});

export const noteSchema = yup.object({
  title: yup.string().max(255).required("Vui lòng nhập tiêu đề"),
  content: yup.string().required("Vui lòng nhập nội dung"),
  type: yup.string().oneOf(["markdown", "text"]).optional(),
  is_pinned: yup.boolean().nullable().optional(),
  folder_id: yup.number().nullable().optional(),
});

export const snippetSchema = yup.object({
  title: yup.string().max(255).required("Vui lòng nhập tiêu đề"),
  code_block: yup.string().max(50000).required("Vui lòng nhập code"),
  language: yup.string().max(50).required("Vui lòng chọn ngôn ngữ"),
  description: yup.string().nullable().optional(),
  folder_id: yup.number().nullable().optional(),
});

export const taskSchema = yup.object({
  title: yup.string().max(255).required("Vui lòng nhập tiêu đề"),
  description: yup.string().nullable().optional(),
  status: yup.string().oneOf(["todo", "doing", "done"]).optional(),
  priority: yup.string().oneOf(["low", "medium", "high"]).optional(),
  due_date: yup.string().nullable().optional(),
  reminder_at: yup.string().nullable().optional(),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
export type RegisterFormValues = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormValues = yup.InferType<typeof forgotPasswordSchema>;
export type ChangePasswordFormValues = yup.InferType<typeof changePasswordSchema>;
export type UpdateProfileFormValues = yup.InferType<typeof updateProfileSchema>;
export type FolderFormValues = yup.InferType<typeof folderSchema>;
export type NoteFormValues = yup.InferType<typeof noteSchema>;
export type SnippetFormValues = yup.InferType<typeof snippetSchema>;
export type TaskFormValues = yup.InferType<typeof taskSchema>;
