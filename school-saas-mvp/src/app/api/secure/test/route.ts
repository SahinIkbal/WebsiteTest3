import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Access user info from headers (set by middleware)
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userName = request.headers.get('x-user-name');
  const schoolId = request.headers.get('x-school-id');


  if (!userId) {
    // This case should ideally be prevented by middleware, but good to double check
    return NextResponse.json({ message: 'User not authenticated or headers not set' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'This is a protected API route.',
    user: {
      id: userId,
      role: userRole,
      name: userName,
      schoolId: schoolId,
    }
  });
}
