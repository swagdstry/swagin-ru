// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"; // или правильный путь к lib/auth.ts

export const { GET, POST } = handlers;