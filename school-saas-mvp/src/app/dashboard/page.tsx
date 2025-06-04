'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthTokenPayload } from '@/lib/auth';
import withAuth from '@/components/auth/withAuth'; // Import the HOC

// Original Dashboard component logic (now without the manual useEffect for auth check)
function DashboardPageContent({ currentUser }: { currentUser: AuthTokenPayload }) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    router.push('/login');
  };

  if (!currentUser) {
    // This should ideally not be reached if withAuth works correctly
    return <p>Loading user data...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {currentUser.name}!</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
            {currentUser.schoolId && <p><strong>School ID:</strong> {currentUser.schoolId}</p>}
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
            <p>This area will show role-specific actions.</p>
            {currentUser.role === 'admin' && <p><a href="/admin/manage-teachers" className="text-blue-600 hover:underline">Manage Teachers (Admin)</a></p>}
            {currentUser.role === 'teacher' && <p><a href="/teacher/my-classes" className="text-blue-600 hover:underline">My Classes (Teacher)</a></p>}
            {currentUser.role === 'student' && <p><a href="/student/my-grades" className="text-blue-600 hover:underline">View Grades (Student)</a></p>}
          </div>
        </div>
        <div className="mt-6">
          <p className="text-center text-gray-600">More features coming soon!</p>
        </div>
      </div>
    </div>
  );
}

// Wrap the dashboard page content with withAuth
// No specific roles needed for generic dashboard, just authentication.
// If dashboard was admin-only, it would be: withAuth(DashboardPageContent, { allowedRoles: ['admin'] });
const ProtectedDashboardPage = withAuth(DashboardPageContent);

export default function Page() {
  return <ProtectedDashboardPage />;
}
