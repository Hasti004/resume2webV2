import { supabase } from "@/integrations/supabase/client";

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Returns the current session or null. Use for optional auth (e.g. show login vs account).
 */
export async function getSessionOrNull() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

/**
 * Throws if no session. Use in loaders/actions or before rendering protected UI.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
