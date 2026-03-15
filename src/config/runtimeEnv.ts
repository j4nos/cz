export function getAppUrlEnv() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

export function getNodeEnv() {
  return process.env.NODE_ENV?.trim() || "";
}
