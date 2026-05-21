import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
export const metadata: Metadata = { title: "Оформление заказа | ЭФИР" };
export default function CheckoutPage() {
  return <div className="pt-16 min-h-screen"><CheckoutClient /></div>;
}
