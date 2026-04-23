import { redirect } from "next/navigation";

// TEMPORARY: redirect to mentors.html (to be removed in ~1 month)
export default function Home() {
  redirect("/mentors.html");
}
