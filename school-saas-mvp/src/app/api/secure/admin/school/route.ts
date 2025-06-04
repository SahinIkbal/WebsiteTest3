import { NextRequest, NextResponse } from 'next/server';
import { getSchoolById, updateSchool, School } from '@/lib/data/schools'; // Ensure paths are correct
// User data will be read from headers set by middleware

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const schoolId = request.headers.get('x-school-id');

    if (userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can access this resource' }, { status: 403 });
    }

    if (!schoolId) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school or school ID missing in token' }, { status: 403 });
    }

    const school = getSchoolById(schoolId);

    if (!school) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(school, { status: 200 });

  } catch (error) {
    console.error('Error fetching school details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const schoolIdFromToken = request.headers.get('x-school-id');

    if (userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can update school details' }, { status: 403 });
    }

    if (!schoolIdFromToken) {
      return NextResponse.json({ message: 'Forbidden: Admin not associated with a school or school ID missing in token' }, { status: 403 });
    }

    const body = await request.json();
    // Destructure only the fields that can be updated to prevent unintended updates
    const { name, address, contactInfo } = body;

    if (!name && !address && !contactInfo) {
        return NextResponse.json({ message: 'No update data provided. Provide name, address, or contactInfo.' }, { status: 400 });
    }

    const updateData: Partial<Omit<School, 'id'>> = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (contactInfo) updateData.contactInfo = contactInfo;


    const updatedSchool = updateSchool(schoolIdFromToken, updateData);

    if (!updatedSchool) {
      // This could happen if the schoolIdFromToken was valid but somehow school not found during update
      return NextResponse.json({ message: 'School not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updatedSchool, { status: 200 });

  } catch (error) {
    console.error('Error updating school details:', error);
    if (error instanceof SyntaxError) { // Handle cases where JSON parsing might fail
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
