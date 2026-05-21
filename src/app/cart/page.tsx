import type { Metadata } from "next";
import { CartClient } from "@/components/cart/CartClient";
export const metadata: Metadata = { title: "Корзина | ЭФИР" };
export default function CartPage() {
  return <div className="pt-16 min-h-screen"><CartClient /></div>;
}
