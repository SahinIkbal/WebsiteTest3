import { NextRequest, NextResponse } from 'next/server';
import {
    createClass as createClassData, // Renamed to avoid conflict
    getAllClasses as getAllClassesData, // Renamed
    Class
} from '@/lib/data/classes';
import { getUserById } from '@/lib/data/users'; // To validate teacher

export async function POST(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can create classes' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const body = await request.json();
    const { name, teacherId } = body;

    if (!name || !teacherId) {
      return NextResponse.json({ message: 'Class name and teacher ID are required' }, { status: 400 });
    }

    // Validate teacher
    const teacher = getUserById(teacherId);
    if (!teacher || teacher.role !== 'teacher' || teacher.schoolId !== adminSchoolId) {
      return NextResponse.json({ message: 'Invalid teacher ID or teacher not associated with this school' }, { status: 400 });
    }

    const newClass = createClassData({
      name,
      teacherId,
      schoolId: adminSchoolId,
    });

    return NextResponse.json({ message: 'Class created successfully', class: newClass }, { status: 201 });

  } catch (error) {
    console.error('Error creating class:', error);
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
      return NextResponse.json({ message: 'Forbidden: Only admins can view classes' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const classesInSchool = getAllClassesData(adminSchoolId); // Pass schoolId to filter

    // Optionally, enrich class data with teacher names
    const populatedClasses = classesInSchool.map(cls => {
        const teacher = getUserById(cls.teacherId);
        return {
            ...cls,
            teacherName: teacher ? teacher.name : 'N/A (Teacher not found)'
        };
    });


    return NextResponse.json(populatedClasses, { status: 200 });

  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
