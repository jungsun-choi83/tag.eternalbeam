import { randomBytes } from "crypto";

export function generateOwnerKey(): string {
  return randomBytes(32).toString("base64url");
}
