// Simple password hashing for MVP - In a real app, use bcrypt or argon2
const simpleHash = (password: string) => `hashed_${password}`;

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Store hashed passwords
  role: UserRole;
  schoolId?: string; // Optional: only for teachers and students, admin might not be tied to one school
  name: string; // Added name field
  rollNumber?: string; // Added for students
  classIds?: string[];  // Added for students (IDs of classes they are in)
}

// Make sure 'users' is exported if other modules like students.ts directly manipulate it.
// However, it's better to expose CRUD functions like below.
export const users: User[] = [
  { id: 'user1', email: 'admin@example.com', passwordHash: simpleHash('adminpass'), role: 'admin', schoolId: 'school1', name: 'Principal Admin' },
  { id: 'user2', email: 'teacher1@example.com', passwordHash: simpleHash('teacherpass'), role: 'teacher', schoolId: 'school1', name: 'Ms. Das' },
  { id: 'user3', email: 'student1@example.com', passwordHash: simpleHash('studentpass'), role: 'student', schoolId: 'school1', name: 'Rohan Sharma', rollNumber: 'S1001', classIds: ['class1'] },
];

export const getAllUsers = (): User[] => users;

export const getUserById = (id: string): User | undefined =>
  users.find(user => user.id === id);

export const getUserByEmail = (email: string): User | undefined =>
  users.find(user => user.email === email);

// Modified createUser to accept new fields
export const createUser = (
  userData: Omit<User, 'id' | 'passwordHash'> & { password: string } // Basic Omit, specific fields handled below
): User => {
  const newUser: User = {
    id: `user${users.length + 1}`,
    email: userData.email,
    passwordHash: simpleHash(userData.password),
    role: userData.role,
    name: userData.name,
    schoolId: userData.schoolId,
    rollNumber: userData.rollNumber, // Added
    classIds: userData.classIds || [], // Added, default to empty array
  };
  users.push(newUser);
  return newUser;
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return simpleHash(password) === hash;
};

// Modified updateUser to handle new fields for students
export const updateUser = (
  userId: string,
  updates: Partial<Omit<User, 'id' | 'passwordHash' >>, // More flexible updates type
  performingUserRole?: UserRole,
  performingUserSchoolId?: string
): User | undefined => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return undefined;

  const userToUpdate = users[userIndex];

  // Security check for admin updates (can be expanded)
  if (performingUserRole === 'admin' && performingUserSchoolId) {
    if (userToUpdate.schoolId !== performingUserSchoolId && userToUpdate.role !== 'admin') { // Admin can only update users in their school
      console.warn(`Admin (school: ${performingUserSchoolId}) attempt to update user ${userId} (school: ${userToUpdate.schoolId}) denied.`);
      return undefined;
    }
    // Prevent admin from updating another admin's schoolId or role easily (more checks needed for such sensitive ops)
    if (userToUpdate.role === 'admin' && (updates.schoolId || updates.role)) {
        console.warn(`Admin attempt to change another admin's role or schoolId denied.`);
        return undefined;
    }
  }

  const allowedUpdates: Partial<User> = { ...users[userIndex] }; // Start with existing data

  if (updates.name) {
    allowedUpdates.name = updates.name;
  }
  if (updates.email) {
    if (updates.email !== userToUpdate.email) {
        const existingByEmail = users.find(u => u.email === updates.email && u.id !== userId);
        if (existingByEmail) {
            console.error(`Update failed: Email ${updates.email} already in use by user ${existingByEmail.id}`);
            return undefined;
        }
    }
    allowedUpdates.email = updates.email;
  }

  // Student-specific fields, only if the user being updated IS a student
  if (userToUpdate.role === 'student') {
    if (updates.rollNumber) {
      allowedUpdates.rollNumber = updates.rollNumber;
    }
    if (updates.classIds) {
      if (Array.isArray(updates.classIds) && updates.classIds.every(id => typeof id === 'string')) {
        allowedUpdates.classIds = updates.classIds;
      } else {
        console.warn("UpdateUser: classIds for student was not an array of strings, not updated.");
      }
    }
  }

  // Prevent changing role or schoolId via this generic update for non-admins / specific conditions
  if (updates.role && updates.role !== userToUpdate.role && performingUserRole !== 'admin') { // Example: only admin can change roles
      console.warn("Role change denied via generic update.");
      // Or implement specific role change function
  } else if (updates.role) {
      allowedUpdates.role = updates.role;
  }

  if (updates.schoolId && updates.schoolId !== userToUpdate.schoolId && performingUserRole !== 'admin') {
      console.warn("SchoolId change denied via generic update.");
  } else if (updates.schoolId) {
      allowedUpdates.schoolId = updates.schoolId;
  }


  users[userIndex] = { ...userToUpdate, ...allowedUpdates }; // Apply accumulated changes

  const { passwordHash, ...updatedUserData } = users[userIndex];
  return updatedUserData as User;
};

export const deleteUser = (
    userId: string,
    performingUserRole?: UserRole,
    performingUserSchoolId?: string
): boolean => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;

  const userToDelete = users[userIndex];

  if (performingUserRole === 'admin' && performingUserSchoolId) {
      if (userToDelete.role === 'admin' && userToDelete.id !== /* ID of current admin if self-delete allowed */'') { // Admin cannot delete other admins
          console.warn(`Admin (school: ${performingUserSchoolId}) attempt to delete admin user ${userId} denied.`);
          return false;
      }
      if (userToDelete.schoolId !== performingUserSchoolId && userToDelete.role !== 'admin') { // Admin can only delete users in their school
          console.warn(`Admin (school: ${performingUserSchoolId}) attempt to delete user ${userId} (school: ${userToDelete.schoolId}) denied.`);
          return false;
      }
  }

  users.splice(userIndex, 1);
  return true;
};
