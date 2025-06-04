'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { AuthTokenPayload } from '@/lib/auth';
import { User } from '@/lib/data/users'; // Teacher data will be User objects

// Define a type for teacher data, excluding passwordHash
type TeacherData = Omit<User, 'passwordHash'>;

interface TeacherManagementPageProps {
  currentUser: AuthTokenPayload; // Injected by withAuth
}

function TeacherManagementPage({ currentUser }: TeacherManagementPageProps) {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentTeacher, setCurrentTeacher] = useState<TeacherData | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Only for 'add' mode

  const router = useRouter();

  const fetchTeachers = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/secure/admin/teachers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch teachers');
      }
      const data: TeacherData[] = await response.json();
      setTeachers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchTeachers();
    }
  }, [currentUser]);

  const openModal = (mode: 'add' | 'edit', teacher?: TeacherData) => {
    setModalMode(mode);
    setError(''); // Clear main page error when modal opens
    setSuccessMessage(''); // Clear main page success when modal opens
    if (mode === 'edit' && teacher) {
      setCurrentTeacher(teacher);
      setName(teacher.name);
      setEmail(teacher.email);
      setPassword(''); // Clear password field for edit
    } else {
      setCurrentTeacher(null);
      setName('');
      setEmail('');
      setPassword('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTeacher(null);
    // Clear form fields
    setName('');
    setEmail('');
    setPassword('');
    setError(''); // Clear modal specific error
  };

  const handleModalSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); // Clear previous modal errors
    setSuccessMessage(''); // Clear previous main page success messages

    const token = localStorage.getItem('authToken');
    if (!token) {
        setError("Authentication error. Please login again.");
        return;
    }

    const endpoint = modalMode === 'add'
      ? '/api/secure/admin/teachers'
      : `/api/secure/admin/teachers/${currentTeacher?.id}`;

    const method = modalMode === 'add' ? 'POST' : 'PUT';

    const body: any = { name, email };
    if (modalMode === 'add') {
      body.password = password;
      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters for new teachers.");
        return;
      }
    }
     if (!name || !email) {
        setError("Name and Email are required.");
        return;
    }


    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${modalMode} teacher`);
      }

      setSuccessMessage(`Teacher ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
      fetchTeachers(); // Refresh the list
      closeModal();
    } catch (err: any) {
      setError(err.message); // Show error inside the modal
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/secure/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete teacher');
      }
      setSuccessMessage('Teacher deleted successfully!');
      fetchTeachers(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };


  if (isLoading) {
    return <div className="p-4 text-center">Loading teachers...</div>;
  }

  // Handled by withAuth, but as a safeguard
  if (currentUser.role !== 'admin') {
      return <div className="p-4 text-center text-red-500">Access Denied. This page is for administrators only.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teachers</h1>
        <button
          onClick={() => openModal('add')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md text-sm"
        >
          Add New Teacher
        </button>
      </div>

      {error && !isModalOpen && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && !isModalOpen && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

      {/* Teacher List Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.length > 0 ? teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal('edit', teacher)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No teachers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</h2>
            {error && <p className="mb-2 text-xs text-red-600 bg-red-100 p-2 rounded-md">{error}</p>} {/* Modal specific error */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
              {modalMode === 'add' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                  {modalMode === 'add' ? 'Add Teacher' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(TeacherManagementPage, { allowedRoles: ['admin'] });
