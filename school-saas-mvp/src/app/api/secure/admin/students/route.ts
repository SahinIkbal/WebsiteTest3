import { NextRequest, NextResponse } from 'next/server';
import {
    createUser,
    getUserByEmail,
    getAllUsers,
    User,
    UserRole,
    updateUser, // For student updates
    deleteUser  // For student deletion
} from '@/lib/data/users';
import { getClassById } from '@/lib/data/classes'; // To validate classIds

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role') as UserRole;
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin' || !adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, rollNumber, classIds } = body;

    if (!email || !password || !name || !rollNumber ) {
      return NextResponse.json({ message: 'Email, password, name, and roll number are required' }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }
    if (classIds && !Array.isArray(classIds)) {
        return NextResponse.json({ message: 'classIds must be an array of strings.' }, { status: 400 });
    }

    // Validate classIds if provided
    if (classIds && classIds.length > 0) {
        for (const classId of classIds) {
            const cls = getClassById(classId);
            if (!cls || cls.schoolId !== adminSchoolId) {
                return NextResponse.json({ message: `Invalid classId: ${classId} or class not in this school.` }, { status: 400 });
            }
        }
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const newStudent = createUser({
      email,
      password,
      name,
      role: 'student',
      schoolId: adminSchoolId,
      rollNumber,
      classIds: classIds || [], // Default to empty array if not provided
    });

    const { passwordHash, ...studentData } = newStudent;
    return NextResponse.json({ message: 'Student created successfully', student: studentData }, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    if (error instanceof SyntaxError) return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin' || !adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const allUsers = getAllUsers();
    const studentsInSchool = allUsers
      .filter(user => user.role === 'student' && user.schoolId === adminSchoolId)
      .map(({ passwordHash, ...studentData }) => {
          // Populate class names for each student
          const populatedClassIds = (studentData.classIds || []).map(classId => {
              const cls = getClassById(classId);
              return { id: classId, name: cls ? cls.name : 'Unknown Class' };
          });
          return { ...studentData, classes: populatedClassIds };
      });

    return NextResponse.json(studentsInSchool, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
