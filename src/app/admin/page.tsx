import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
export const metadata: Metadata = { title: "Администратор | ЭФИР" };
export default function AdminPage() {
  return <div className="pt-16 min-h-screen bg-zinc-950"><AdminDashboard /></div>;
}
