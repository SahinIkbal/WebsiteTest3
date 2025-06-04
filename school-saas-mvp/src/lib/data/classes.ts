import { getUserById } from './users';

export interface Class {
  id: string;
  name: string; // e.g., "Class 10 - Section A"
  teacherId: string; // User ID of the teacher
  schoolId: string;
}

const classes: Class[] = [
  { id: 'class1', name: 'Class 10 - Section A', teacherId: 'user2', schoolId: 'school1' },
  { id: 'class2', name: 'Class 9 - Section B', teacherId: 'user2', schoolId: 'school1' }, // Assuming teacher1 teaches multiple classes
];

export const getAllClasses = (schoolId?: string): Class[] =>
  schoolId ? classes.filter(c => c.schoolId === schoolId) : classes;

export const getClassById = (id: string): Class | undefined =>
  classes.find(c => c.id === id);

export const getClassesByTeacher = (teacherId: string, schoolId: string): Class[] =>
  classes.filter(c => c.teacherId === teacherId && c.schoolId === schoolId);

export const createClass = (classData: Omit<Class, 'id'>): Class => {
  const newClass: Class = { ...classData, id: `class${classes.length + 1}` };
  classes.push(newClass);
  return newClass;
};
// Update/Delete functions can be added later

export const updateClass = (
    classId: string,
    updates: Partial<Omit<Class, 'id' | 'schoolId'>>, // Admin can update name, teacherId
    adminSchoolId: string // Ensure admin is updating a class in their own school
): Class | undefined => {
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return undefined;

    const classToUpdate = classes[classIndex];
    if (classToUpdate.schoolId !== adminSchoolId) {
        console.warn(`Admin (school: ${adminSchoolId}) attempt to update class ${classId} (school: ${classToUpdate.schoolId}) denied.`);
        return undefined; // Or throw error
    }

    // Validate new teacherId if provided
    if (updates.teacherId) {
        const teacher = getUserById(updates.teacherId);
        if (!teacher || teacher.role !== 'teacher' || teacher.schoolId !== adminSchoolId) {
            // throw new Error("Invalid new teacher ID or teacher not in this school.");
            return undefined; // Or specific error
        }
    }

    classes[classIndex] = { ...classToUpdate, ...updates };
    return classes[classIndex];
};

export const deleteClass = (
    classId: string,
    adminSchoolId: string
): boolean => {
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return false;

    if (classes[classIndex].schoolId !== adminSchoolId) {
        console.warn(`Admin (school: ${adminSchoolId}) attempt to delete class ${classId} (school: ${classes[classIndex].schoolId}) denied.`);
        return false;
    }

    // Add any dependency checks here if needed (e.g., if students are assigned to this class)
    // For MVP, direct deletion is allowed.

    classes.splice(classIndex, 1);
    return true;
};
