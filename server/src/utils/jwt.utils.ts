import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;
if (!jwtSecret) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

/**
 * @param payload 
 * @returns 
 */
export function signJwt(payload: object): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '2d' });
}

/**
 * @param token 
 * @returns 
 */

export function verifyJwt(token: string): object | null {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as object;
  } catch (e) {
    return null;
  }
}
