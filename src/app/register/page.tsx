import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/login?message=Registration is invitation-only. Ask Hamza for an invite link.");
}
