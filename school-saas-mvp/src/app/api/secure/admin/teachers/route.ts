import { NextRequest, NextResponse } from 'next/server';
import {
    createUser,
    getUserByEmail,
    UserRole,
    User,
    getAllUsers // We'll use this and filter by schoolId and role
} from '@/lib/data/users'; // Ensure paths are correct

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can create teachers' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Email, password, and name are required for the new teacher' }, { status: 400 });
    }
    // Basic password validation (example)
    if (password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const newTeacher = createUser({
      email,
      password,
      name,
      role: 'teacher', // Explicitly set role to 'teacher'
      schoolId: adminSchoolId, // Associate with the admin's school
    });

    // Exclude passwordHash from the returned user object
    const { passwordHash, ...teacherData } = newTeacher;

    return NextResponse.json({ message: 'Teacher created successfully', teacher: teacherData }, { status: 201 });

  } catch (error) {
    console.error('Error creating teacher:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can view teachers' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const allUsers = getAllUsers();
    const teachersInSchool = allUsers
      .filter(user => user.role === 'teacher' && user.schoolId === adminSchoolId)
      .map(({ passwordHash, ...teacherData }) => teacherData); // Exclude passwordHash

    return NextResponse.json(teachersInSchool, { status: 200 });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
