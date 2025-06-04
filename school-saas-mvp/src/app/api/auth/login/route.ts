import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/data/users'; // Ensure paths are correct
import { generateToken, AuthTokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);

    const userPayload: AuthTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        name: user.name
    };

    // Return the token and user info (excluding password)
    return NextResponse.json({ message: 'Login successful', token, user: userPayload }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
