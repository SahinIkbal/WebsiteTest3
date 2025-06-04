'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { AuthTokenPayload } from '@/lib/auth';
import { School } from '@/lib/data/schools'; // Assuming School interface is exported

interface SchoolManagementPageProps {
  currentUser: AuthTokenPayload; // Injected by withAuth
}

function SchoolManagementPage({ currentUser }: SchoolManagementPageProps) {
  const [school, setSchool] = useState<School | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      setError('');
      setSuccessMessage('');
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login'); // Should be caught by withAuth, but as a safeguard
          return;
        }

        const response = await fetch('/api/secure/admin/school', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 403) {
            setError("You are not authorized to view this page or your admin account is not linked to a school.");
            setIsLoading(false);
            return;
        }
        if (response.status === 404) {
            setError("School details not found. Please contact support.");
            setIsLoading(false);
            return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch school details');
        }

        const data: School = await response.json();
        setSchool(data);
        setName(data.name);
        setAddress(data.address);
        setContactInfo(data.contactInfo);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser.role === 'admin') {
      fetchSchoolDetails();
    } else {
        setError("Access denied. This page is for administrators only."); // Should be caught by withAuth
        setIsLoading(false);
    }
  }, [currentUser, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsUpdating(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Authentication error. Please login again.");
        setIsUpdating(false);
        return;
      }

      const response = await fetch('/api/secure/admin/school', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, address, contactInfo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update school details');
      }

      setSchool(data); // Update local state with the new details
      setName(data.name);
      setAddress(data.address);
      setContactInfo(data.contactInfo);
      setSuccessMessage('School details updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading school details...</div>;
  }

  if (error && !school) { // If there's a critical error and no school data (e.g. 403, 404)
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!school && currentUser.role === 'admin' && !isLoading) {
     // This case might happen if admin has no schoolId or school not found initially
     return <div className="p-4 text-center text-orange-500">Could not load school details. Ensure your admin account is correctly associated with a school.</div>;
  }

  // If user is not admin, withAuth should redirect, but this is a fallback.
  if (currentUser.role !== 'admin') {
      return <div className="p-4 text-center text-red-500">Access Denied.</div>
  }


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage School Details</h1>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

      {school ? (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-lg p-6">
          <div>
            <label htmlFor="schoolIdDisplay" className="block text-sm font-medium text-gray-700">School ID</label>
            <input
              type="text"
              id="schoolIdDisplay"
              value={school.id}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">School Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">Contact Information</label>
            <input
              type="text"
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update School Details'}
            </button>
          </div>
        </form>
      ) : (
        !isLoading && <p className="text-center text-gray-500">No school details to display. This might indicate an issue with your account setup.</p>
      )}
    </div>
  );
}

// Wrap the component with withAuth, requiring 'admin' role
export default withAuth(SchoolManagementPage, { allowedRoles: ['admin'] });
