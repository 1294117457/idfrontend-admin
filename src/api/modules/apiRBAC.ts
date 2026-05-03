import apiClient from '@common/utils/http'

// ========== 通用响应接口 ==========
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ========== 类型定义 ==========

/**
 * 角色
 */
export interface RolePO {
  id: number
  roleCode: string
  roleName: string
  description?: string
  sortOrder?: number
  status: number
  isSystem?: number
  createdAt?: string
  updatedAt?: string
}

/**
 * 权限
 */
export interface PermissionPO {
  id: number
  permissionCode: string
  permissionName: string
  module?: string
  description?: string
  sortOrder?: number
  status: number
  createdAt?: string
  updatedAt?: string
}

/**
 * 角色 DTO
 */
export interface RoleDTO {
  id?: number
  roleCode: string
  roleName: string
  description?: string
  sortOrder?: number
  status?: number
}

/**
 * 权限 DTO
 */
export interface PermissionDTO {
  id?: number
  permissionCode: string
  permissionName: string
  module?: string
  description?: string
  sortOrder?: number
  status?: number
}

/**
 * 用户角色分配 DTO
 */
export interface UserRoleDTO {
  userId: number
  roleIds: number[]
}

/**
 * 角色权限分配 DTO
 */
export interface RolePermissionDTO {
  roleId: number
  permissionIds: number[]
}

// ==================== 角色管理 API ====================

/**
 * 获取所有角色列表
 */
export const getRoleList = async (): Promise<ApiResponse<RolePO[]>> => {
  return await apiClient.get('/api/system/role/list')
}

/**
 * 获取角色详情
 */
export const getRoleById = async (id: number): Promise<ApiResponse<RolePO>> => {
  return await apiClient.get(`/api/system/role/${id}`)
}

/**
 * 创建角色
 */
export const createRole = async (data: RoleDTO): Promise<ApiResponse<RolePO>> => {
  return await apiClient.post('/api/system/role/create', data)
}

/**
 * 更新角色
 */
export const updateRole = async (data: RoleDTO): Promise<ApiResponse<void>> => {
  return await apiClient.put('/api/system/role/update', data)
}

/**
 * 删除角色
 */
export const deleteRole = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete(`/api/system/role/${id}`)
}

/**
 * 获取角色的权限列表
 */
export const getRolePermissions = async (roleId: number): Promise<ApiResponse<PermissionPO[]>> => {
  return await apiClient.get(`/api/system/role/${roleId}/permissions`)
}

/**
 * 为角色分配权限
 */
export const assignPermissionsToRole = async (data: RolePermissionDTO): Promise<ApiResponse<void>> => {
  return await apiClient.post('/api/system/role/assignPermissions', data)
}

// ==================== 权限管理 API ====================

/**
 * 获取所有权限列表
 */
export const getPermissionList = async (): Promise<ApiResponse<PermissionPO[]>> => {
  return await apiClient.get('/api/system/permission/list')
}

/**
 * 按模块获取权限
 */
export const getPermissionsByModule = async (module: string): Promise<ApiResponse<PermissionPO[]>> => {
  return await apiClient.get(`/api/system/permission/module/${module}`)
}

/**
 * 创建权限
 */
export const createPermission = async (data: PermissionDTO): Promise<ApiResponse<PermissionPO>> => {
  return await apiClient.post('/api/system/permission/create', data)
}

/**
 * 更新权限
 */
export const updatePermission = async (data: PermissionDTO): Promise<ApiResponse<PermissionPO>> => {
  return await apiClient.put('/api/system/permission/update', data)
}

/**
 * 删除权限
 */
export const deletePermission = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete(`/api/system/permission/${id}`)
}
