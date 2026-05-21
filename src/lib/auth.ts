import { cookies } from "next/headers";
import { verifyTokenSafe, type JWTPayload } from "./jwt";

export const AUTH_COOKIE_NAME = "efir_auth_token";

export async function getAuthFromCookies(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyTokenSafe(token);
  } catch {
    return null;
  }
}

export async function getAuthFromRequest(request: Request): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    return verifyTokenSafe(token);
  } catch {
    return null;
  }
}
