/**
 * Xóa thư mục src/api/ trước khi generate để đảm bảo
 * không còn file cũ gây conflict với API mới.
 */
import { rmSync, existsSync } from "fs";
import { resolve } from "path";

const dir = resolve(process.cwd(), "src/api");

if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log("[clean-api] ✓ Removed src/api/");
} else {
  console.log("[clean-api] src/api/ not found, skipping.");
}
