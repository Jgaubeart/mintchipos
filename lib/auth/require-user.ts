import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }
}
