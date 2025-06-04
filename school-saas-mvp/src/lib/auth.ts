import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { User, UserRole } from './data/users'; // Assuming User and UserRole are exported from users.ts

// IMPORTANT: In a real application, use an environment variable for the secret key!
// For example: process.env.JWT_SECRET
const JWT_SECRET = 'your-super-secret-and-long-enough-jwt-secret-key';
const JWT_EXPIRES_IN = '1h'; // Token expiration time
const encoder = new TextEncoder();
const secret = encoder.encode(JWT_SECRET);

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  name: string;
}

export const generateToken = async (user: User): Promise<string> => {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    name: user.name,
  };

  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
};

export const verifyToken = async (token: string): Promise<AuthTokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthTokenPayload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
