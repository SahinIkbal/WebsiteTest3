import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/data/users';

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

    const allUsers = getAllUsers();
    const teachersInSchool = allUsers
      .filter(user => user.role === 'teacher' && user.schoolId === adminSchoolId)
      .map(teacher => ({ id: teacher.id, name: teacher.name })); // Return only id and name

    return NextResponse.json(teachersInSchool, { status: 200 });

  } catch (error) {
    console.error('Error fetching teachers list:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
