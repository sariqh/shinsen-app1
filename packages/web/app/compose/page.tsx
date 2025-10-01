import { redirect } from "next/navigation";

export default function LegacyComposeRedirect() {
  redirect("/composition");
}