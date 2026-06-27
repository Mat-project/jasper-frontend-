/**
 * Root page — redirects to /dashboard (or /login if unauthenticated).
 * The middleware handles the actual auth check redirect.
 */
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
