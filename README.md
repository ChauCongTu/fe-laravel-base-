# LifeOS — Frontend

Ứng dụng quản lý cuộc sống cá nhân: ghi chú, công việc, snippets và thư mục. Xây dựng trên **Next.js 16 App Router**, tích hợp với backend Laravel qua OpenAPI.

---

## Cài đặt & Chạy

```bash
# 1. Cài dependencies
yarn install

# 2. Cấu hình môi trường
cp .env.example .env

# 3. Generate API client từ OpenAPI spec
yarn generate

# 4. Chạy dev server
yarn dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Biến môi trường

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL của backend | `https://lifeos.test/api` |
| `NEXT_PUBLIC_ORVAL_API_URL` | URL endpoint OpenAPI spec | `https://lifeos.test/api/v1/documentation/openapi.json` |
| `NEXT_PUBLIC_OPENAPI_API_KEY` | API key xác thực khi fetch spec | `your-api-key` |
| `NEXT_PUBLIC_OPENAPI_API_SECRET` | Secret ký HMAC signature | `your-secret` |

---

## OpenAPI & Code Generation

Đây là phần cốt lõi của project. Toàn bộ API client — hooks, types, request functions — được **tự động sinh** từ OpenAPI spec, không viết tay.

### Luồng hoạt động

```
Backend Laravel
      │
      │  GET /v1/documentation/openapi.json
      │  Headers: X-API-Key, X-Timestamp, X-Signature (HMAC SHA256)
      ▼
scripts/fetch-api.mts
      │
      │  Lưu vào
      ▼
api.json  (OpenAPI spec local — source of truth)
      │
      │  Orval đọc, filter theo tag
      ▼
src/api/
  ├── auth/
  │   ├── index.ts        ← React Query hooks (useAuthLogin, useAuthMe, ...)
  │   └── model/          ← TypeScript types (UserResource, LoginRequest, ...)
  ├── notes/
  ├── tasks/
  ├── snippets/
  ├── folders/
  └── events/
```

### Scripts

```bash
yarn generate          # Fetch spec mới từ BE + generate (dùng khi BE thay đổi API)
yarn generate:offline  # Generate từ api.json hiện có, không cần kết nối BE
yarn generate:watch    # Watch mode — tự generate lại khi api.json thay đổi
yarn fetch-api         # Chỉ fetch spec, không generate
```

> `yarn build` tự chạy `yarn generate` trước qua `prebuild`.

### Cấu hình Orval (`orval.config.ts`)

Mỗi tag trong OpenAPI spec được map thành một module riêng:

```ts
export default defineConfig({
  auth:     { input: makeInput("Auth"),    output: makeOutput("auth") },
  folders:  { input: makeInput("Folder"),  output: makeOutput("folders") },
  notes:    { input: makeInput("Note"),    output: makeOutput("notes") },
  snippets: { input: makeInput("Snippet"), output: makeOutput("snippets") },
  tasks:    { input: makeInput("Task"),    output: makeOutput("tasks") },
});
```

Tất cả hooks dùng chung một Axios instance (`src/lib/axios-instance.ts`) làm mutator — tự động đính kèm Bearer token và xử lý lỗi 401.

---

## Sử dụng API trong code

### Quy tắc chung

Orval sinh ra 2 loại cho mỗi endpoint:

- **`useXxx`** — React Query hook dùng trong component (query hoặc mutation)
- **`xxxFn`** — Hàm thuần gọi trực tiếp nếu cần ngoài component

Response luôn có dạng `{ data: T }` cho single resource, `{ data: T[] }` cho collection. Riêng login/register có thêm `token`.

---

### Auth

#### Đăng nhập

```tsx
import { useAuthLogin } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";

const { mutate: login, isPending } = useAuthLogin({
  mutation: {
    onSuccess: (res) => {
      // res.data = UserResource, res.token = Bearer token
      setAuth(res.data, res.token);
      router.replace("/dashboard");
    },
    onError: (err) => {
      // err là AxiosError<{ message: string }>
    },
  },
});

// Gọi mutation
login({ data: { email: "user@example.com", password: "secret", device_name: "web" } });
```

#### Lấy thông tin user hiện tại

```tsx
import { useAuthMe } from "@/api/auth";

const { data: me } = useAuthMe({ query: { retry: false } });
// me?.data = UserResource | undefined

const currentUser = useAuthStore((s) => s.user) ?? me?.data;
```

#### Cập nhật hồ sơ

```tsx
import { useAuthUpdateProfile } from "@/api/auth";

const { mutate: updateProfile } = useAuthUpdateProfile({
  mutation: {
    onSuccess: (res) => {
      setUser(res.data); // res.data = UserResource đã cập nhật
    },
  },
});

updateProfile({
  data: {
    name: "Nguyễn Văn A",
    phone: "+84901234567",
    gender: "male", // "male" | "female" | "other" | "prefer_not_to_say"
  },
});
```

#### Upload avatar

```tsx
import { useAuthUploadAvatar } from "@/api/auth";

const { mutate: uploadAvatar } = useAuthUploadAvatar({
  mutation: {
    onSuccess: (res) => setUser(res.data),
  },
});

// Nhận File từ input[type=file]
uploadAvatar({ data: { avatar: file } });
// Axios tự detect FormData, set Content-Type: multipart/form-data
```

#### Đổi mật khẩu

```tsx
import { useAuthChangePassword } from "@/api/auth";

const { mutate: changePassword } = useAuthChangePassword({
  mutation: {
    onSuccess: () => resetForm(),
    onError: (err) => { /* xử lý lỗi validation */ },
  },
});

changePassword({
  data: {
    current_password: "old-password",
    password: "new-password",
    password_confirmation: "new-password",
  },
});
```

---

### Notes

#### Lấy danh sách & tìm kiếm

```tsx
import { useNotesIndex } from "@/api/notes";
import type { NoteResource } from "@/api/notes/model";

const { data, isLoading } = useNotesIndex();
const notes: NoteResource[] = data?.data ?? [];

// Tìm kiếm client-side
const filtered = notes.filter((n) =>
  n.title.toLowerCase().includes(search.toLowerCase())
);
```

#### Tạo ghi chú mới

```tsx
import { useNotesStore, getNotesIndexQueryKey } from "@/api/notes";

const { mutate: createNote } = useNotesStore({
  mutation: {
    onSuccess: (res) => {
      // res.data = NoteResource vừa tạo
      qc.invalidateQueries({ queryKey: getNotesIndexQueryKey() });
      setSelectedNote(res.data);
    },
  },
});

createNote({
  data: {
    title: "Tiêu đề ghi chú",
    content: "Nội dung...",
    type: "markdown", // "text" | "markdown"
    is_pinned: false,
  },
});
```

#### Cập nhật (autosave)

```tsx
import { useNotesUpdate } from "@/api/notes";

const { mutate: updateNote } = useNotesUpdate({
  mutation: {
    onSuccess: () => setSaveStatus("saved"),
  },
});

// note là số (number), không phải string
updateNote({
  note: selectedNote.id,
  data: {
    title: state.title,
    content: state.content,
    type: state.type,
    is_pinned: state.is_pinned, // boolean
  },
});
```

#### Xóa

```tsx
import { useNotesDestroy } from "@/api/notes";

const { mutate: deleteNote } = useNotesDestroy({
  mutation: {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getNotesIndexQueryKey() });
    },
  },
});

deleteNote({ note: noteId }); // noteId: number
```

#### NoteResource type

```ts
interface NoteResource {
  id: number;
  folder_id: number | null;
  folder?: FolderResource;
  title: string;
  content: string;
  type: string;          // "text" | "markdown"
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}
```

---

### Tasks

#### Lấy danh sách & filter theo status

```tsx
import { useTasksIndex } from "@/api/tasks";

const { data } = useTasksIndex();
const allTasks = data?.data ?? [];

// Filter theo tab
const filtered = activeTab === "all"
  ? allTasks
  : allTasks.filter((t) => t.status === activeTab);

// Đếm theo status
const counts = {
  todo:  allTasks.filter((t) => t.status === "todo").length,
  doing: allTasks.filter((t) => t.status === "doing").length,
  done:  allTasks.filter((t) => t.status === "done").length,
};
```

#### Tạo công việc

```tsx
import { useTasksStore } from "@/api/tasks";

const { mutate: createTask } = useTasksStore({
  mutation: {
    onSuccess: (res) => {
      // res.data = TaskResource vừa tạo
      setSelected(res.data);
    },
  },
});

createTask({
  data: {
    title: "Tên công việc",
    status: "todo",    // "todo" | "doing" | "done"
    priority: "medium", // "low" | "medium" | "high"
    due_date: "2026-12-31T23:59:00", // ISO string, nullable
    description: null,
  },
});
```

#### Cập nhật (autosave + toggle done)

```tsx
import { useTasksUpdate } from "@/api/tasks";

const { mutate: updateTask } = useTasksUpdate({
  mutation: { onSuccess: () => setSaveStatus("saved") },
});

// Autosave chi tiết
updateTask({
  task: selected.id, // number
  data: { title, description, status, priority, due_date },
});

// Toggle done/todo nhanh
const toggleDone = (task: TaskResource) => {
  updateTask({
    task: task.id,
    data: { title: task.title, status: task.status === "done" ? "todo" : "done" },
  });
};
```

#### Drag & drop Kanban (đổi status)

```tsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// draggableId phải là string — dùng String(task.id)
<Draggable draggableId={String(task.id)} index={index}>

// onDragEnd: parse lại thành number
const onDragEnd = (result: DropResult) => {
  const newStatus = result.destination.droppableId as "todo" | "doing" | "done";
  const taskId = Number(result.draggableId);
  const task = allTasks.find((t) => t.id === taskId);
  updateTask({ task: taskId, data: { title: task.title, status: newStatus } });
};
```

#### TaskResource type

```ts
interface TaskResource {
  id: number;
  title: string;
  description: string | null;
  status: string;          // "todo" | "doing" | "done"
  status_label: string;    // "Cần làm" | "Đang làm" | "Hoàn thành"
  priority: string;        // "low" | "medium" | "high"
  priority_label: string;
  priority_color: string;
  due_date: string;
  reminder_at: string;
  is_overdue: boolean;     // true nếu đã quá hạn
  is_due_today: boolean;
  days_until_due: number | null;
  created_at: string;
  updated_at: string;
}
```

---

### Snippets

#### Tạo & cập nhật snippet

```tsx
import { useSnippetsStore, useSnippetsUpdate } from "@/api/snippets";

const { mutate: createSnippet } = useSnippetsStore({
  mutation: {
    onSuccess: (res) => setSelected(res.data),
  },
});

createSnippet({
  data: {
    title: "Tên snippet",
    code_block: "const x = 1;",
    language: "typescript",
    description: null, // nullable
  },
});

// Cập nhật
updateSnippet({
  snippet: selected.id, // number
  data: { title, code_block, language, description },
});
```

---

### Folders

#### CRUD thư mục

```tsx
import { useFoldersIndex, useFoldersStore, useFoldersUpdate, useFoldersDestroy } from "@/api/folders";

// Lấy danh sách
const { data } = useFoldersIndex();
const folders = data?.data ?? [];

// Tạo
createFolder({ data: { name: "Tên thư mục", color: "#7c3aed", icon: "📁" } });

// Cập nhật — param là "folder", không phải "id"
updateFolder({ folder: editTarget.id, data: { name, color, icon } });

// Xóa
deleteFolder({ folder: folderId }); // folderId: number
```

#### FolderResource type

```ts
interface FolderResource {
  id: number;
  name: string;
  color: string | null;   // hex color, vd: "#7c3aed"
  icon: string | null;    // emoji, vd: "📁"
  parent_id: number | null;
  children?: FolderResource[];
  notes_count?: number;
  snippets_count?: number;
  created_at: string;
  updated_at: string;
}
```

---

### Invalidate cache sau mutation

Sau khi tạo/sửa/xóa, cần invalidate query để UI cập nhật:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { getNotesIndexQueryKey } from "@/api/notes";
import { getTasksIndexQueryKey } from "@/api/tasks";
import { getAuthMeQueryKey } from "@/api/auth";

const qc = useQueryClient();

// Invalidate danh sách notes
qc.invalidateQueries({ queryKey: getNotesIndexQueryKey() });

// Invalidate user info
qc.invalidateQueries({ queryKey: getAuthMeQueryKey() });
```

---

### Xử lý lỗi

```tsx
import type { AxiosError } from "axios";

const { mutate } = useNotesStore({
  mutation: {
    onError: (err: unknown) => {
      const e = err as AxiosError<{
        message: string;
        errors?: Record<string, string[]>; // validation errors
      }>;

      const serverErrors = e.response?.data?.errors;
      if (serverErrors) {
        // Map lỗi validation vào từng field của form
        Object.entries(serverErrors).forEach(([field, messages]) => {
          setError(field, { message: messages[0] });
        });
      } else {
        setError("root", { message: e.response?.data?.message ?? "Lỗi không xác định" });
      }
    },
  },
});
```

---

### Response format

```ts
// Single resource (GET /notes/:id, POST /notes, PUT /notes/:id)
type SingleResponse<T> = { data: T }

// Collection (GET /notes)
type CollectionResponse<T> = { data: T[] }

// Auth login / register
type AuthResponse = {
  data: UserResource;
  token: string;
  token_type: "Bearer";
}

// Lấy data
const note = res.data;          // NoteResource
const notes = res.data;         // NoteResource[]
const user = res.data;          // UserResource
const token = res.token;        // string (chỉ có ở login/register)
```

---

### Thêm endpoint mới

Khi BE thêm API mới:

1. Chạy `yarn generate` để fetch spec mới và generate lại
2. Hook mới tự xuất hiện trong `src/api/<module>/index.ts`
3. Types mới trong `src/api/<module>/model/`
4. Import và dùng như bình thường — không cần viết thêm gì

```bash
# Nếu BE đang chạy local
yarn generate

# Nếu không có kết nối BE (đã có api.json mới)
yarn generate:offline
```

> **Không bao giờ sửa tay** các file trong `src/api/` — chúng sẽ bị ghi đè khi generate lại.

---

## Cấu trúc thư mục

```
app/                    # Next.js App Router pages
  (auth)/               # login, register, forgot-password
  (dashboard)/          # dashboard, notes, tasks, snippets, folders, profile

src/
  api/                  # ⚡ Auto-generated — KHÔNG sửa tay
  components/           # UI components theo feature
  hooks/                # use-autosave, use-draft, use-mobile
  lib/                  # axios-instance, query-client, yup schemas
  providers/            # Mantine, TanStack Query providers
  stores/               # Zustand: auth-store, ui-store

scripts/
  fetch-api.mts         # Fetch OpenAPI spec từ BE (HMAC auth)
  clean-api.mts         # Dọn dẹp api.json

api.json                # OpenAPI spec local
orval.config.ts         # Cấu hình code generation
```

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 App Router |
| UI | Mantine 9, Tabler Icons, Tailwind CSS 4 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| API client | Axios + Orval (OpenAPI codegen) |
| Forms | React Hook Form + Yup |
| Drag & Drop | @hello-pangea/dnd |
| Markdown | react-markdown + remark-gfm |
