import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, UserRole } from '@/lib/data/users'; // Ensure paths are correct
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, schoolId } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: 'Email, password, name, and role are required' }, { status: 400 });
    }

    if (role !== 'admin' && !schoolId) {
        return NextResponse.json({ message: 'School ID is required for teachers and students' }, { status: 400 });
    }

    // TODO: Add more robust validation for email, password strength, role, etc.

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const newUser = createUser({
      email,
      password,
      name,
      role: role as UserRole, // Make sure role is of type UserRole
      schoolId: role === 'admin' ? schoolId : schoolId // Admins can optionally have schoolId
    });

    // Do not automatically log in user on registration for this MVP to keep it simple
    // const token = generateToken(newUser);
    // return NextResponse.json({ message: 'User registered successfully', user: {id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }, token }, { status: 201 });

    return NextResponse.json({
        message: 'User registered successfully. Please login.',
        user: {id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, schoolId: newUser.schoolId }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
