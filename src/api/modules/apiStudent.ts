import apiClient from '@common/utils/http'

// ==================== 学生相关类型 ====================

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

// ==================== 学生 API（对应后端 /api/user/student/*）====================

/**
 * 绑定学生信息（无需验证码）
 */
export const bindStudentInfo = async (data: StudentDTO) => {
  return await apiClient.post('/api/user/student/bind', data)
}

/**
 * 获取学生基本信息
 */
export const getStudentBasicInfo = async () => {
  return await apiClient.get('/api/user/student/info')
}

/**
 * 更新学生信息
 */
export const updateStudentInfo = async (data: StudentDTO) => {
  return await apiClient.put('/api/user/student/info', data)
}

/**
 * 确认学生信息
 */
export const confirmStudentInfo = async () => {
  return await apiClient.post('/api/user/student/confirm')
}

/**
 * 管理员分页查询学生数据
 */
export const getStudentDataList = async (params: StudentQueryParams) => {
  return await apiClient.get('/api/user/student/list', { params })
}
