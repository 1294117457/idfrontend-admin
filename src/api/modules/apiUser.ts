import apiClient from '@common/utils/http'

// ==================== 用户相关类型 ====================

export interface UserDTO {
  userId?: number
  username: string  // 即学校邮箱
  password?: string
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
  return await apiClient.post('/api/user/admin/create', data)
}

/**
 * ✅ 删除用户
 */
export const deleteUser = async (userId: number) => {
  return await apiClient.delete(`/api/user/admin/${userId}`)
}
export interface UserInfoVO {
  // 用户信息
  userId: number
  username: string  // 即学校邮箱
  phone?: string
  avatar?: string

  // 学生信息(如果已绑定)
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
  return await apiClient.get('/api/user/profile')
}

/**
 * 获取用户完整信息（包含学生信息）
 */
export const getUserCompleteInfo = async () => {
  return await apiClient.get('/api/user/complete-info')
}

/**
 * 更新用户基本信息
 */
export const updateUserBasicInfo = async (data: Partial<UserDTO>) => {
  return await apiClient.put('/api/user/profile', data)
}

/**
 * 上传当前用户头像。后端会返回公开访问 URL，并同步写入 users.avatar。
 */
export const uploadAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return await apiClient.post('/api/file/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * ✅ 用户管理查询参数
 */
export interface UserManageQueryParams {
  username?: string
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
  username: string  // 即学校邮箱
  phone?: string
  role: string
  status: string
  lastLoginAt?: string

  // 学生信息（可选）
  fullName?: string
  major?: string
  grade?: number
  graduationYear?: number
}

/**
 * ✅ 管理员查询用户列表（显示所有用户，学生信息可选）
 */
export const getUserListForAdmin = async (params: UserManageQueryParams) => {
  return await apiClient.get('/api/user/admin/list', { params })
}

/**
 * ✅ 获取指定用户的角色列表
 */
export const getUserRoles = async (userId: number) => {
  return await apiClient.get(`/api/user/${userId}/roles`)
}

/**
 * ✅ 为用户分配角色（覆盖式）
 */
export const assignUserRoles = async (userId: number, roleIds: number[]) => {
  return await apiClient.post(`/api/user/${userId}/roles`, { roleIds })
}

/**
 * ✅ 禁用或启用用户
 */
export const updateUserStatus = async (userId: number, status: 'active' | 'inactive') => {
  return await apiClient.put(`/api/user/admin/${userId}/status`, { status })
}

/**
 * 获取当前登录用户的角色列表（无需 admin 权限）
 */
export const getMyRoles = async () => {
  return await apiClient.get('/api/user/me/roles')
}

/**
 * 批量创建用户
 */
export const batchCreateUsers = async (usernames: string[]) => {
  return await apiClient.post('/api/user/admin/batch-create', { usernames })
}

/**
 * 获取学生导出字段列表（动态）
 */
export const getStudentExportFields = async () => {
  return await apiClient.get('/api/user/student/export-fields')
}
