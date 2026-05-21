import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  userId: number;
  phone: string;
  role: "customer" | "admin";
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "efir-default-secret-change-in-production-2024";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JWTPayload;
}

export async function verifyTokenSafe(token: string): Promise<JWTPayload | null> {
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
