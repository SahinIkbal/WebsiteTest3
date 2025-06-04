import jwt from 'jsonwebtoken';
import { User, UserRole } from './data/users'; // Assuming User and UserRole are exported from users.ts

// IMPORTANT: In a real application, use an environment variable for the secret key!
// For example: process.env.JWT_SECRET
const JWT_SECRET = 'your-super-secret-and-long-enough-jwt-secret-key';
const JWT_EXPIRES_IN = '1h'; // Token expiration time

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  name: string;
}

export const generateToken = (user: User): string => {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
