/**
 * Fetch OpenAPI spec từ BE về api.json local với bảo mật HMAC signature.
 * File .mts → tsx tự nhận là ESM, hỗ trợ top-level await.
 *
 * dotenv/config tự load .env và .env.local — không cần parse thủ công.
 *
 * Chạy: yarn fetch-api
 * Override: NEXT_PUBLIC_ORVAL_API_URL=https://... yarn fetch-api
 */

import "dotenv/config";
import https from "https";
import http from "http";
import { createHmac } from "crypto";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const OUTPUT = resolve(process.cwd(), "api.json");

const API_URL = process.env.NEXT_PUBLIC_ORVAL_API_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_OPENAPI_API_KEY ?? "";
const API_SECRET = process.env.NEXT_PUBLIC_OPENAPI_API_SECRET ?? "";

// Nếu không phải HTTP URL → dùng local file
if (!API_URL.startsWith("http")) {
  console.log(`[fetch-api] Using local file: ${API_URL}`);
  process.exit(0);
}

console.log(`[fetch-api] Fetching spec from: ${API_URL}`);

interface SignatureData {
  timestamp: string;
  signature: string;
}

/**
 * Tạo HMAC SHA256 signature để xác thực với BE
 */
function generateSignature(
  method: string,
  urlPath: string,
  body: string = ""
): SignatureData {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // String format phải khớp với backend Laravel
  const stringToSign = `${method}\n${urlPath}\n${timestamp}\n${body}`;

  const signature = createHmac("sha256", API_SECRET)
    .update(stringToSign)
    .digest("hex");

  return { timestamp, signature };
}

/**
 * Extract path từ URL (bỏ protocol, domain)
 * VD: https://api.example.com/api/docs/openapi.json → api/docs/openapi.json
 */
function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    // Bỏ dấu / đầu tiên
    return parsed.pathname.slice(1);
  } catch {
    return url;
  }
}

function fetchUrl(url: string, useAuth: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Thêm authentication headers nếu có API_KEY và API_SECRET
    if (useAuth && API_KEY && API_SECRET) {
      const urlPath = extractPath(url);
      const { timestamp, signature } = generateSignature("GET", urlPath);

      headers["X-API-Key"] = API_KEY;
      headers["X-Timestamp"] = timestamp;
      headers["X-Signature"] = signature;

      console.log(`[fetch-api] 🔐 Auth enabled (key: ${API_KEY.slice(0, 10)}...)`);
    } else if (useAuth) {
      console.warn(
        "[fetch-api] ⚠️  OPENAPI_API_KEY or OPENAPI_API_SECRET not set — skipping auth"
      );
    }

    const req = lib.get(
      url,
      {
        timeout: 10_000,
        rejectUnauthorized: false, // self-signed SSL cho dev local
        headers,
      },
      (res) => {
        // Handle redirects
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          console.log(`[fetch-api] ↪ Redirecting to: ${res.headers.location}`);
          fetchUrl(res.headers.location, useAuth).then(resolve).catch(reject);
          return;
        }

        // Handle errors
        if (res.statusCode !== 200) {
          let errorBody = "";
          res.setEncoding("utf8");
          res.on("data", (chunk: string) => (errorBody += chunk));
          res.on("end", () => {
            const errorMsg = `HTTP ${res.statusCode} ${res.statusMessage}`;
            const details = errorBody ? `\nResponse: ${errorBody}` : "";
            reject(new Error(errorMsg + details));
          });
          return;
        }

        // Success - collect data
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout 10s"));
    });
    req.on("error", reject);
  });
}

try {
  const raw = await fetchUrl(API_URL);

  // Validate JSON trước khi write
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    throw new Error(
      `Invalid JSON response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
    );
  }

  // Write với pretty format
  writeFileSync(OUTPUT, JSON.stringify(parsed, null, 2), "utf-8");

  // Statistics
  const pathCount = Object.keys(parsed.paths || {}).length;
  const schemaCount = Object.keys(parsed.components?.schemas || {}).length;

  console.log(`[fetch-api] ✓ api.json updated successfully`);
  console.log(`[fetch-api]   - Endpoints: ${pathCount}`);
  console.log(`[fetch-api]   - Schemas: ${schemaCount}`);
  console.log(`[fetch-api]   - Output: ${OUTPUT}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);

  if (existsSync(OUTPUT)) {
    console.warn(
      `[fetch-api] ⚠️  Fetch failed: ${msg}\n[fetch-api] ℹ️  Using existing api.json as fallback`
    );
  } else {
    console.error(
      `[fetch-api] ✗ Fetch failed, no fallback available:\n${msg}`
    );
    process.exit(1);
  }
}