import type { Metadata } from "next";
import { ProfileClient } from "@/components/profile/ProfileClient";
export const metadata: Metadata = { title: "Профиль | ЭФИР" };
export default function ProfilePage() {
  return <div className="pt-16 min-h-screen"><ProfileClient /></div>;
}
