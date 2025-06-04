'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { AuthTokenPayload } from '@/lib/auth';
import { Class } from '@/lib/data/classes'; // Assuming Class interface is exported

// Interface for class data that includes teacherName (populated by API)
interface PopulatedClass extends Class {
  teacherName?: string;
}
// Interface for the minimal teacher data for dropdowns
interface TeacherOption {
  id: string;
  name: string;
}

interface ClassManagementPageProps {
  currentUser: AuthTokenPayload; // Injected by withAuth
}

function ClassManagementPage({ currentUser }: ClassManagementPageProps) {
  const [classes, setClasses] = useState<PopulatedClass[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentClass, setCurrentClass] = useState<PopulatedClass | null>(null);

  const [className, setClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const router = useRouter();

  const fetchClassesAndTeachers = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Authentication token not found.");

      // Fetch classes
      const classResponse = await fetch('/api/secure/admin/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!classResponse.ok) {
        const errData = await classResponse.json();
        throw new Error(errData.message || 'Failed to fetch classes');
      }
      const classData: PopulatedClass[] = await classResponse.json();
      setClasses(classData);

      // Fetch available teachers for dropdown
      const teacherListResponse = await fetch('/api/secure/admin/teachers-list', {
         headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!teacherListResponse.ok) {
          const errData = await teacherListResponse.json();
          throw new Error(errData.message || 'Failed to fetch teachers list');
      }
      const teacherOptionsData: TeacherOption[] = await teacherListResponse.json();
      setAvailableTeachers(teacherOptionsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchClassesAndTeachers();
    }
  }, [currentUser]);

  const openModal = (mode: 'add' | 'edit', cls?: PopulatedClass) => {
    setModalMode(mode);
    setError('');
    setSuccessMessage('');
    if (mode === 'edit' && cls) {
      setCurrentClass(cls);
      setClassName(cls.name);
      setSelectedTeacherId(cls.teacherId);
    } else {
      setCurrentClass(null);
      setClassName('');
      setSelectedTeacherId(availableTeachers.length > 0 ? availableTeachers[0].id : ''); // Default to first teacher or empty
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentClass(null);
    setClassName('');
    setSelectedTeacherId(availableTeachers.length > 0 ? availableTeachers[0].id : '');
    setError('');
  };

  const handleModalSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const token = localStorage.getItem('authToken');
    if (!token) {
        setError("Authentication error. Please login again.");
        return;
    }

    if (!className.trim() || !selectedTeacherId) {
        setError("Class name and assigned teacher are required.");
        return;
    }

    const endpoint = modalMode === 'add'
      ? '/api/secure/admin/classes'
      : `/api/secure/admin/classes/${currentClass?.id}`;

    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const body = { name: className, teacherId: selectedTeacherId };

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
        throw new Error(data.message || `Failed to ${modalMode} class`);
      }

      setSuccessMessage(`Class ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
      fetchClassesAndTeachers();
      closeModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/secure/admin/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete class');
      }
      setSuccessMessage('Class deleted successfully!');
      fetchClassesAndTeachers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading class data...</div>;
  }

  if (currentUser.role !== 'admin') {
      return <div className="p-4 text-center text-red-500">Access Denied.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Classes</h1>
        <button
          onClick={() => openModal('add')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md text-sm"
        >
          Add New Class
        </button>
      </div>

      {error && !isModalOpen && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && !isModalOpen && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class ID</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.length > 0 ? classes.map((cls) => (
              <tr key={cls.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.teacherName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal('edit', cls)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No classes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Add New Class' : 'Edit Class'}</h2>
            {error && <p className="mb-2 text-xs text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label htmlFor="className" className="block text-sm font-medium text-gray-700">Class Name</label>
                <input type="text" id="className" value={className} onChange={(e) => setClassName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">Assign Teacher</label>
                <select
                    id="teacherId"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                >
                  <option value="" disabled>Select a teacher</option>
                  {availableTeachers.length > 0 ? availableTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  )) : (
                    <option value="" disabled>No teachers available</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                  {modalMode === 'add' ? 'Add Class' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ClassManagementPage, { allowedRoles: ['admin'] });
