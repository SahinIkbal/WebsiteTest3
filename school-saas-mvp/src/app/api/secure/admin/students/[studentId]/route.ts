import { NextRequest, NextResponse } from 'next/server';
import {
    getUserById,
    updateUser,
    deleteUser,
    User,
    UserRole
} from '@/lib/data/users';
import { getClassById } from '@/lib/data/classes';

export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    const adminRole = request.headers.get('x-user-role') as UserRole;
    const adminSchoolId = request.headers.get('x-school-id');
    const studentId = params.studentId;

    if (adminRole !== 'admin' || !adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const studentToUpdate = getUserById(studentId);
    if (!studentToUpdate || studentToUpdate.role !== 'student' || studentToUpdate.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Student not found or not associated with this school' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, rollNumber, classIds } = body;

    // Validate classIds if provided
    if (classIds) {
        if (!Array.isArray(classIds)) return NextResponse.json({ message: 'classIds must be an array.'},{ status: 400 });
        for (const classId of classIds) {
            const cls = getClassById(classId);
            if (!cls || cls.schoolId !== adminSchoolId) {
                return NextResponse.json({ message: `Invalid classId: ${classId} or class not in this school.` }, { status: 400 });
            }
        }
    }

    const updateData: Partial<Omit<User, 'id' | 'passwordHash' | 'role' | 'schoolId'>> & { rollNumber?: string, classIds?: string[] } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email; // updateUser in users.ts already checks for email uniqueness
    if (rollNumber) updateData.rollNumber = rollNumber;
    if (classIds) updateData.classIds = classIds;


    const updatedStudent = updateUser(studentId, updateData, adminRole, adminSchoolId);

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Update failed: Student not found, email conflict, or permission issue.' }, { status: 400 });
    }

    // Populate class names for the response
    const populatedClassDetails = (updatedStudent.classIds || []).map(cid => {
        const cls = getClassById(cid);
        return { id: cid, name: cls ? cls.name : 'Unknown Class' };
    });

    return NextResponse.json({
        message: 'Student updated successfully',
        student: {...updatedStudent, classes: populatedClassDetails }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating student:', error);
    if (error instanceof SyntaxError) return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const adminRole = request.headers.get('x-user-role') as UserRole;
    const adminSchoolId = request.headers.get('x-school-id');
    const studentId = params.studentId;

    if (adminRole !== 'admin' || !adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const studentToDelete = getUserById(studentId);
    if (!studentToDelete || studentToDelete.role !== 'student' || studentToDelete.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Student not found or not associated with this school' }, { status: 404 });
    }

    const success = deleteUser(studentId, adminRole, adminSchoolId);
    if (!success) {
      return NextResponse.json({ message: 'Failed to delete student or permission issue.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
