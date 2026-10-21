/** A short-lived in-memory view of a Supabase-authenticated platform admin. */
export type AdminSession = {
  userId: string;
  username: string;
  loggedAt: string;
};
