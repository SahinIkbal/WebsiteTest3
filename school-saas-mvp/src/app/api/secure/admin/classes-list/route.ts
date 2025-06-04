import { NextRequest, NextResponse } from 'next/server';
import { getAllClasses } from '@/lib/data/classes'; // Use the existing function

export async function GET(request: NextRequest) {
  try {
    const adminRole = request.headers.get('x-user-role');
    const adminSchoolId = request.headers.get('x-school-id');

    if (adminRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can access this list' }, { status: 403 });
    }
    if (!adminSchoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school' }, { status: 403 });
    }

    const classesInSchool = getAllClasses(adminSchoolId) // Get classes for the admin's school
      .map(cls => ({ id: cls.id, name: cls.name })); // Return only id and name

    return NextResponse.json(classesInSchool, { status: 200 });

  } catch (error) {
    console.error('Error fetching classes list:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
