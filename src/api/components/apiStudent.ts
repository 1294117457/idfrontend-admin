import apiClient from '@/utils/http'

// ==================== 学生相关类型 ====================

export interface StudentDTO {
  email?: string
  code?: string
  studentId?: string
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
  studentId: string
}

export interface StudentDataItem {
  id: number
  userId: number
  username: string
  studentId: string
  studentEmail: string
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
  studentId?: string
  fullName?: string
  major?: string
  grade?: number
  isConfirmed?: boolean
  pageNum: number
  pageSize: number
}

// ==================== 学生 API ====================

/**
 * 发送学生邮箱验证码
 */
export const sendStudentEmailCode = async (email: string) => {
  const response = await apiClient.post<{
    code: number
    msg: string
    data: { status: string; validMinutes: number }
  }>('/api/student/send-code', { email })
  
  return response.data
}

/**
 * 绑定学生信息
 */
export const bindStudentInfo = async (data: StudentDTO) => {
  const response = await apiClient.post<{
    code: number
    msg: string
    data: BindStudentVO
  }>('/api/student/bind', data)
  
  return response.data
}

/**
 * 获取学生基本信息
 */
export const getStudentBasicInfo = async () => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: StudentDTO
  }>('/api/student/info')
  
  return response.data
}

/**
 * 更新学生信息
 */
export const updateStudentInfo = async (data: StudentDTO) => {
  const response = await apiClient.put<{
    code: number
    msg: string
    data: string
  }>('/api/student/info', data)
  
  return response.data
}

/**
 * 确认学生信息
 */
export const confirmStudentInfo = async () => {
  const response = await apiClient.post<{
    code: number
    msg: string
    data: string
  }>('/api/student/confirm')
  
  return response.data
}

/**
 * 管理员分页查询学生数据
 */
export const getStudentDataList = async (params: StudentQueryParams) => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: {
      list: StudentDataItem[]
      total: number
      pageNum: number
      pageSize: number
    }
  }>('/api/student/list', { params })
  
  return response.data
}