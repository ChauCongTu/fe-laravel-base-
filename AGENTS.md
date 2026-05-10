<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:security-rules -->
# Security: Environment Files Are Off-Limits

Never read, write, modify, display, or reference the contents of any `.env` file, including but not limited to:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`
- Any file matching the pattern `.env*`

If a task requires knowledge of environment variables, ask the user to provide only the variable **names** (not values) needed. Never echo, log, or include secret values in responses, code comments, or generated files.
<!-- END:security-rules -->
