export function maskStudentId(studentId: string): string {
  if (!studentId || studentId.length < 6) return "******";
  return studentId.slice(0, 6) + "*****";
}
