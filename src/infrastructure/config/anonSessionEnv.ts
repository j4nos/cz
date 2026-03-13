export function getAnonSessionSecret() {
  return process.env.ANON_SESSION_SECRET?.trim() || "";
}
