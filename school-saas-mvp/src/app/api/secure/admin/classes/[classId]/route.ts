import { NextRequest, NextResponse } from 'next/server';
import {
    getClassById,
    updateClass, // Use the new updateClass
    deleteClass, // Use the new deleteClass
    Class
} from '@/lib/data/classes';
import { getUserById } from '@/lib/data/users'; // To validate teacher for updates

export async function PUT(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');
    const classId = params.classId;

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can update classes' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const classToUpdate = getClassById(classId);
    if (!classToUpdate || classToUpdate.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Class not found or not associated with this school' }, { status: 404 });
    }

    const body = await request.json();
    const { name, teacherId } = body;

    if (!name && !teacherId) {
        return NextResponse.json({ message: 'No update data provided. Provide name or teacherId.' }, { status: 400 });
    }

    const updateData: Partial<Omit<Class, 'id' | 'schoolId'>> = {};
    if (name) updateData.name = name;
    if (teacherId) {
        // Validate the new teacherId
        const teacher = getUserById(teacherId);
        if (!teacher || teacher.role !== 'teacher' || teacher.schoolId !== adminSchoolId) {
            return NextResponse.json({ message: 'Invalid new teacher ID or teacher not in this school.' }, { status: 400 });
        }
        updateData.teacherId = teacherId;
    }

    const updatedClass = updateClass(classId, updateData, adminSchoolId);

    if (!updatedClass) {
      // updateClass might return undefined if teacher validation within it fails or permission issues
      return NextResponse.json({ message: 'Update failed: Class not found or invalid data (e.g. teacher issue).' }, { status: 400 });
    }

    // Populate teacher name for the response
    const teacherDetails = getUserById(updatedClass.teacherId);
    const responseClass = {
        ...updatedClass,
        teacherName: teacherDetails ? teacherDetails.name : 'N/A'
    };

    return NextResponse.json({ message: 'Class updated successfully', class: responseClass }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating class:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');
    const classId = params.classId;

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can delete classes' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const classToDelete = getClassById(classId);
    if (!classToDelete || classToDelete.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Class not found or not associated with this school' }, { status: 404 });
    }

    const success = deleteClass(classId, adminSchoolId);
    if (!success) {
      return NextResponse.json({ message: 'Failed to delete class or permission denied.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Class deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
