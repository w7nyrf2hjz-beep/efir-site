import type { Metadata } from "next";
import { AuthClient } from "@/components/auth/AuthClient";
export const metadata: Metadata = { title: "Вход | ЭФИР" };
export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24">
      <AuthClient />
    </div>
  );
}
