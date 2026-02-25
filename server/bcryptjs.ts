import { randomBytes, pbkdf2Sync } from "crypto";

/**
 * Gera um hash seguro para a senha usando PBKDF2.
 * @param password Senha em texto puro
 * @param saltRounds Número de iterações (quanto maior, mais seguro, mas mais lento)
 */
export async function hash(password: string, saltRounds: number): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = pbkdf2Sync(password, salt, saltRounds * 100, 64, "sha512").toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Compara uma senha com o hash armazenado.
 * @param password Senha em texto puro
 * @param hashed Hash armazenado no banco
 */
export async function compare(password: string, hashed: string): Promise<boolean> {
  const [salt, originalHash] = hashed.split(":");
  const derivedKey = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return derivedKey === originalHash;
}
