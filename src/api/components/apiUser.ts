import apiClient from '@/utils/http'

// ==================== 用户相关类型 ====================

export interface UserDTO {
  userId: number
  username: string
  email: string
  phone?: string
  avatar?: string
  nickname?: string
  role?: string
  status?: string
}

export interface UserInfoVO {
  // 用户信息
  userId: number
  username: string
  email: string
  phone?: string

  // 学生信息(如果已绑定)
  studentId?: string
  studentEmail?: string
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
}

// ==================== 用户 API ====================

/**
 * 获取用户基本信息
 */
export const getUserBasicInfo = async () => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: UserDTO
  }>('/api/user/profile')
  
  return response.data
}

/**
 * 获取用户完整信息（包含学生信息）
 */
export const getUserCompleteInfo = async () => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: UserInfoVO
  }>('/api/user/complete-info')
  
  return response.data
}

/**
 * 更新用户基本信息
 */
export const updateUserBasicInfo = async (data: Partial<UserDTO>) => {
  const response = await apiClient.put<{
    code: number
    msg: string
    data: string
  }>('/api/user/profile', data)
  
  return response.data
}