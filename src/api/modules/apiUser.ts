import apiClient from '@common/utils/http'

// ========== 通用响应 ==========
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ==================== 用户相关类型 ====================

export interface UserDTO {
  userId?: number
  username: string
  password?: string
  phone?: string
  avatar?: string
  nickname?: string
  role?: string
  status?: string
}

export interface UserInfoVO {
  userId: number
  username: string
  phone?: string
  avatar?: string
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
  email?: string
  studentEmail?: string
  enrollmentYear?: number
  foreignLanguageLevel?: string
  disciplinaryViolations?: number
  failedCourses?: number
  specialSkillsRemark?: string
  recommendationStatus?: string
}

// ==================== 用户 API ====================

export const createUser = async (data: UserDTO): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/user/admin/create', data)
}

export const deleteUser = async (userId: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/user/admin/${userId}`)
}

export const getUserBasicInfo = async (): Promise<ApiResponse<UserInfoVO>> => {
  return await apiClient.get('/api/user/profile')
}

export const getUserCompleteInfo = async (): Promise<ApiResponse<UserInfoVO>> => {
  return await apiClient.get('/api/user/complete-info')
}

export const updateUserBasicInfo = async (data: Partial<UserDTO>): Promise<ApiResponse<any>> => {
  return await apiClient.put('/api/user/profile', data)
}

export const uploadAvatar = async (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append('file', file)
  return await apiClient.post('/api/file/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export interface UserManageQueryParams {
  username?: string
  fullName?: string
  pageNum: number
  pageSize: number
}

export interface RoleVO {
  roleId: number
  roleCode: string
  roleName: string
  description?: string
  status: number
}

export interface UserManageVO {
  userId: number
  username: string
  phone?: string
  role: string
  status: string
  lastLoginAt?: string
  fullName?: string
  major?: string
  grade?: number
  graduationYear?: number
}

export const getUserListForAdmin = async (params: UserManageQueryParams): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/user/admin/list', { params })
}

export const getUserRoles = async (userId: number): Promise<ApiResponse<any>> => {
  return await apiClient.get(`/api/auth/role/${userId}/roles`)
}

export const assignUserRoles = async (userId: number, roleIds: number[]): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/auth/role/assign', { userId, roleIds })
}

export const updateUserStatus = async (userId: number, status: 'active' | 'inactive'): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/user/admin/${userId}/status`, { status })
}

export const getMyRoles = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/user/me/roles')
}

export const batchCreateUsers = async (usernames: string[]): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/user/admin/batch-create', { usernames })
}

export const getStudentExportFields = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/user/student/export-fields')
}
