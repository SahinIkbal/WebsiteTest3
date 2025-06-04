export interface School {
  id: string;
  name: string;
  address: string;
  contactInfo: string;
}

// In-memory store for schools
const schools: School[] = [
  { id: 'school1', name: 'Demo Public School', address: '123 Education Lane, Kolkata', contactInfo: '033-12345678' }
];

// CRUD functions for schools
export const getAllSchools = (): School[] => schools;

export const getSchoolById = (id: string): School | undefined =>
  schools.find(school => school.id === id);

export const createSchool = (schoolData: Omit<School, 'id'>): School => {
  const newSchool: School = { ...schoolData, id: `school${schools.length + 1}` };
  schools.push(newSchool);
  return newSchool;
};

export const updateSchool = (id: string, updates: Partial<Omit<School, 'id'>>): School | undefined => {
  const schoolIndex = schools.findIndex(school => school.id === id);
  if (schoolIndex === -1) return undefined;
  schools[schoolIndex] = { ...schools[schoolIndex], ...updates };
  return schools[schoolIndex];
};

// Note: Delete functionality might be complex due to dependencies, skipping for MVP initial setup.
