import { NextRequest, NextResponse } from 'next/server';
import {
    getUserById,
    updateUser, // Use the new updateUser
    deleteUser, // Use the new deleteUser
    User,
    UserRole
} from '@/lib/data/users'; // Ensure UserRole is imported if not already

export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    const adminRole = request.headers.get('x-user-role') as UserRole | null;
    const adminSchoolId = request.headers.get('x-school-id');
    const teacherId = params.teacherId;

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can update teachers' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const teacherToUpdate = getUserById(teacherId);
    if (!teacherToUpdate || teacherToUpdate.role !== 'teacher' || teacherToUpdate.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Teacher not found or not associated with this school' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name && !email) {
        return NextResponse.json({ message: 'No update data provided. Provide name or email.' }, { status: 400 });
    }

    const updateData: Partial<Omit<User, 'id' | 'passwordHash' | 'role' | 'schoolId'>> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedTeacher = updateUser(teacherId, updateData, adminRole, adminSchoolId);

    if (!updatedTeacher) {
      // updateUser might return undefined if email is taken or permission denied by internal logic
      return NextResponse.json({ message: 'Update failed: Teacher not found, email already in use, or permission denied.' }, { status: 400 });
    }

    // The updateUser function already returns data without passwordHash
    return NextResponse.json({ message: 'Teacher updated successfully', teacher: updatedTeacher }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating teacher:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const adminRole = request.headers.get('x-user-role') as UserRole | null;
    const adminSchoolId = request.headers.get('x-school-id');
    const teacherId = params.teacherId;

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can delete teachers' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const teacherToDelete = getUserById(teacherId);
    if (!teacherToDelete || teacherToDelete.role !== 'teacher' || teacherToDelete.schoolId !== adminSchoolId) {
      // Check if the user exists but is not a teacher or not in this school, to give a more specific message
      if (teacherToDelete && (teacherToDelete.role !== 'teacher' || teacherToDelete.schoolId !== adminSchoolId)) {
          return NextResponse.json({ message: 'User is not a deletable teacher for this school' }, { status: 403 });
      }
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const success = deleteUser(teacherId, adminRole, adminSchoolId);
    if (!success) {
      // deleteUser might return false if permission denied by internal logic or user not found (though checked above)
      return NextResponse.json({ message: 'Failed to delete teacher or permission denied.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Teacher deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
