import { randomBytes, pbkdf2Sync } from "crypto";

// Implementação simplificada de hash e compare usando PBKDF2
export async function hash(password: string, saltRounds: number): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = pbkdf2Sync(password, salt, saltRounds * 100, 64, "sha512").toString("hex");
  return `${salt}:${derivedKey}`;
}

export async function compare(password: string, hashed: string): Promise<boolean> {
  const [salt, originalHash] = hashed.split(":");
  const derivedKey = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return derivedKey === originalHash;
}
