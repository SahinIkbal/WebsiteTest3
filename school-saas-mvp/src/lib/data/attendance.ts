export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  studentId: string; // User ID of the student
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  schoolId: string;
}

const attendanceRecords: AttendanceRecord[] = [
  { id: 'att1', studentId: 'user3', classId: 'class1', date: '2024-07-28', status: 'present', schoolId: 'school1' },
  // Add more mock attendance records as needed
];

export const getAttendanceByClassAndDate = (classId: string, date: string, schoolId: string): AttendanceRecord[] =>
  attendanceRecords.filter(att => att.classId === classId && att.date === date && att.schoolId === schoolId);

export const getAttendanceByStudent = (studentId: string, schoolId: string, classId?: string): AttendanceRecord[] =>
  attendanceRecords.filter(att =>
    att.studentId === studentId &&
    att.schoolId === schoolId &&
    (classId ? att.classId === classId : true)
  );

export const recordAttendance = (recordData: Omit<AttendanceRecord, 'id'>): AttendanceRecord => {
  // Check for existing record for the same student, class, date and update if found (upsert)
  const existingRecordIndex = attendanceRecords.findIndex(
    att => att.studentId === recordData.studentId &&
           att.classId === recordData.classId &&
           att.date === recordData.date &&
           att.schoolId === recordData.schoolId
  );

  if (existingRecordIndex !== -1) {
    attendanceRecords[existingRecordIndex] = { ...attendanceRecords[existingRecordIndex], ...recordData, id: attendanceRecords[existingRecordIndex].id };
    return attendanceRecords[existingRecordIndex];
  } else {
    const newRecord: AttendanceRecord = { ...recordData, id: `att${attendanceRecords.length + 1}` };
    attendanceRecords.push(newRecord);
    return newRecord;
  }
};
