import apiClient from '@/utils/http'

// ==================== 用户相关类型 ====================

export interface UserDTO {
  userId?: number
  username: string
  password?: string  // ✅ 创建时需要
  email: string
  phone?: string
  avatar?: string
  nickname?: string
  role?: string
  status?: string
}
/**
 * ✅ 创建用户
 */
export const createUser = async (data: UserDTO) => {
  const response = await apiClient.post<{
    code: number
    msg: string
    data: any
  }>('/api/user/admin/create', data)
  
  return response.data
}

/**
 * ✅ 删除用户
 */
export const deleteUser = async (userId: number) => {
  const response = await apiClient.delete<{
    code: number
    msg: string
    data: null
  }>(`/api/user/admin/${userId}`)
  
  return response.data
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

/**
 * ✅ 用户管理查询参数
 */
export interface UserManageQueryParams {
  username?: string
  email?: string
  studentId?: string
  fullName?: string
  pageNum: number
  pageSize: number
}

/**
 * ✅ 角色信息 VO
 */
export interface RoleVO {
  roleId: number
  roleCode: string
  roleName: string
  description?: string
  status: number
}

/**
 * ✅ 用户管理 VO（简化版：不包含角色列表）
 */
export interface UserManageVO {
  // 用户信息（必填）
  userId: number
  username: string
  email: string
  phone?: string
  role: string
  status: string
  lastLoginAt?: string
  
  // 学生信息（可选）
  studentId?: string
  fullName?: string
  major?: string
  grade?: number
  graduationYear?: number
}

/**
 * ✅ 管理员查询用户列表（显示所有用户，学生信息可选）
 */
export const getUserListForAdmin = async (params: UserManageQueryParams) => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: {
      list: UserManageVO[]
      total: number
      pageNum: number
      pageSize: number
    }
  }>('/api/user/admin/list', { params })
  
  return response.data
}

/**
 * ✅ 获取指定用户的角色列表
 */
export const getUserRoles = async (userId: number) => {
  const response = await apiClient.get<{
    code: number
    msg: string
    data: RoleVO[]
  }>(`/api/user/${userId}/roles`)
  
  return response.data
}

/**
 * ✅ 为用户分配角色（覆盖式）
 */
export const assignUserRoles = async (userId: number, roleIds: number[]) => {
  const response = await apiClient.post<{
    code: number
    msg: string
    data: null
  }>(`/api/user/${userId}/roles`, { roleIds })
  
  return response.data
}