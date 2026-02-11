import { redirect } from "next/navigation";

export const metadata = {
  title: "Post | Werbens — Plan Social Content",
  description:
    "Create, schedule, and orchestrate content across social platforms from a single place.",
};

export default function PostPage() {
  // Redirect to /post/now by default
  redirect("/post/now");
}

