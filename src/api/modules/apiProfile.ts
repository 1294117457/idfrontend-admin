import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface EmailItem {
  status: string
  validMinutes: number
}

export const sendEmailCode = async (email: string): Promise<ApiResponse<string>> => {
  return await apiClient.post('/api/userinfo/sendEmailCode', { email })
}

export interface StudentItem {
  email: string
  code: string
  fullName: string
  major: string
  enrollmentYear: number
  graduationYear: number
}

export interface BindItem {
  status: string
  studentId: string
}

export const bindStudentInfo = async (studentData: StudentItem): Promise<ApiResponse<BindItem>> => {
  return await apiClient.post('/api/userinfo/bindStudentInfo', studentData)
}

export interface UserInfoItem {
  userId: number
  username: string
  phone: string
  email: string
  studentId: string
  studentEmail: string
  fullName: string
  enrollmentYear: number
  graduationYear: number
  major: string
  academicScore: number
  specialtyScore: number
  comprehensiveScore: number
  foreignLanguageLevel: string
  disciplinaryViolations: number
  failedCourses: number
  specialSkillsRemark: string
  recommendationStatus: string
}

export const getUserInfo = async (): Promise<ApiResponse<UserInfoItem>> => {
  return await apiClient.get('/api/userinfo/getUserInfo')
}

export interface UpdateStudentItem {
  email: string
  code: string
  fullName: string
  major: string
}

export const updateStudentInfo = async (updateData: UpdateStudentItem): Promise<ApiResponse<string>> => {
  return await apiClient.put('/api/userinfo/updateStudentInfo', updateData)
}
