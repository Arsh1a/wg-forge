import type { RequestHandler } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { deleteSession } from "$lib/sessions";

export const POST: RequestHandler = ({ cookies }) => {
  const token = cookies.get("session");
  if (token) deleteSession(token);
  cookies.delete("session", { path: "/" });
  throw redirect(303, "/login");
};
