// This reuses the User interface for student details if they also log in.
// If students don't log in, a simpler Student interface might be better.
// For now, assuming students are also Users.
// If not, we'd define a separate Student interface here.

import { users, User, getUserById } from './users'; // Assuming students are users

export interface StudentProfile extends User { // Extending User for now
  rollNumber: string;
  classIds: string[]; // Student can be in multiple classes, or just one
}

// This is a conceptual link. Actual student data comes from the 'users' array filtered by role 'student'.
// We'll add functions to manage student-specific attributes like roll number or class assignments.

// Example: Get student profiles (users with role 'student' plus any extra info)
export const getStudentProfilesBySchool = (schoolId: string): StudentProfile[] => {
  return users
    .filter(user => user.role === 'student' && user.schoolId === schoolId)
    .map(user => ({
      ...user,
      // Mock roll number and class assignments for now
      rollNumber: `S${user.id.replace('user', '')}`,
      classIds: user.id === 'user3' ? ['class1'] : [] // Student1 is in Class1
    }));
};

export const getStudentProfileById = (studentId: string): StudentProfile | undefined => {
  const user = getUserById(studentId);
  if (user && user.role === 'student') {
    return {
      ...user,
      rollNumber: `S${user.id.replace('user', '')}`,
      classIds: user.id === 'user3' ? ['class1'] : []
    };
  }
  return undefined;
};

export const getStudentsByClass = (classId: string, schoolId: string): StudentProfile[] => {
  return getStudentProfilesBySchool(schoolId).filter(student => student.classIds.includes(classId));
}

// Functions to add/remove student from class, update roll number would go here.
// For example:
export const assignStudentToClass = (studentId: string, classId: string): boolean => {
  // In a real scenario, you'd update the student's record.
  // Here, we'd need to modify the mock data structure or how classIds are stored/retrieved.
  // For now, this is a placeholder.
  console.log(`Assigning student ${studentId} to class ${classId}`);
  // This is non-mutating for the mock data for now.
  // A real implementation would find the student and update their classIds array.
  const student = users.find(u => u.id === studentId && u.role === 'student');
  if (student) {
      // This is where we'd update the student's classIds, if it were part of the main users array or a separate students array.
      // For the current structure of getStudentProfilesBySchool, this doesn't persist.
      // This highlights a limitation of the current mock structure for complex updates.
      // We'd need a dedicated `studentProfiles` array to mutate.
      return true;
  }
  return false;
};
