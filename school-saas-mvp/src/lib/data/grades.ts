export interface Grade {
  id: string;
  studentId: string; // User ID of the student
  classId: string;
  subject: string; // e.g., "Mathematics", "Physics"
  score: string | number; // Can be a letter grade or numerical score
  term?: string; // e.g., "Midterm", "Final"
  schoolId: string;
}

const grades: Grade[] = [
  { id: 'grade1', studentId: 'user3', classId: 'class1', subject: 'Mathematics', score: 'A+', term: 'Midterm', schoolId: 'school1' },
  { id: 'grade2', studentId: 'user3', classId: 'class1', subject: 'Physics', score: 85, term: 'Midterm', schoolId: 'school1' },
  // Add more mock grades as needed
];

export const getGradesByStudent = (studentId: string, schoolId: string, classId?: string): Grade[] =>
  grades.filter(grade =>
    grade.studentId === studentId &&
    grade.schoolId === schoolId &&
    (classId ? grade.classId === classId : true)
  );

export const getGradesByClass = (classId: string, schoolId: string, subject?:string): Grade[] =>
  grades.filter(grade =>
    grade.classId === classId &&
    grade.schoolId === schoolId &&
    (subject ? grade.subject === subject : true)
  );

export const recordGrade = (gradeData: Omit<Grade, 'id'>): Grade => {
  // Check for existing grade for the same student, class, subject, term and update if found (upsert)
   const existingGradeIndex = grades.findIndex(
    g => g.studentId === gradeData.studentId &&
         g.classId === gradeData.classId &&
         g.subject === gradeData.subject &&
         g.term === gradeData.term && // ensure term is part of uniqueness if used
         g.schoolId === gradeData.schoolId
  );

  if (existingGradeIndex !== -1) {
    grades[existingGradeIndex] = { ...grades[existingGradeIndex], ...gradeData, id: grades[existingGradeIndex].id };
    return grades[existingGradeIndex];
  } else {
    const newGrade: Grade = { ...gradeData, id: `grade${grades.length + 1}` };
    grades.push(newGrade);
    return newGrade;
  }
};
