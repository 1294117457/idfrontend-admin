import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface StudentDTO {
  fullName?: string
  major?: string
  grade?: number
  graduationYear?: number
  gpa?: number
  academicScore?: number
  specialtyScore?: number
  comprehensiveScore?: number
  isConfirmed?: boolean
  demandValue?: string
  demandFiles?: string
  pageNum?: number
  pageSize?: number
}

export interface BindStudentVO {
  status: string
  userId: number
}

export interface StudentDataItem {
  id: number
  username: string
  fullName: string
  grade: number
  graduationYear: number
  major: string
  gpa: number
  academicScore: number
  specialtyScore: number
  comprehensiveScore: number
  isConfirmed: boolean
  demandValue?: string
  demandFiles?: string
}

export interface StudentQueryParams {
  fullName?: string
  major?: string
  grade?: number
  isConfirmed?: boolean
  pageNum: number
  pageSize: number
}

export const bindStudentInfo = async (data: StudentDTO): Promise<ApiResponse<BindStudentVO>> => {
  return await apiClient.post('/api/user/student/bind', data)
}

export const getStudentBasicInfo = async (): Promise<ApiResponse<StudentDTO>> => {
  return await apiClient.get('/api/user/student/info')
}

export const updateStudentInfo = async (data: StudentDTO): Promise<ApiResponse<any>> => {
  return await apiClient.put('/api/user/student/info', data)
}

export const confirmStudentInfo = async (): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/user/student/confirm')
}

export const getStudentDataList = async (params: StudentQueryParams): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/user/student/list', { params })
}
