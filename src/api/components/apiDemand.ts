import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

export interface DemandTemplate {
  id?: number
  templateName: string
  conditions?: string[] | null
  description?: string
  sortOrder?: number
  isActive?: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface DemandTemplateDto {
  id?: number
  templateName: string
  conditions?: string[]
  description?: string
  sortOrder?: number
  isActive?: number
}

/**
 * 获取所有模板(教师端)
 */
export const getAllTemplates = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/demand-template/list`)
  return response.data
}

/**
 * 创建模板
 */
export const createTemplate = async (data: DemandTemplateDto) => {
  const response = await apiClient.post(`${apiBaseUrl}/api/demand-template/create`, data)
  return response.data
}

/**
 * 更新模板
 */
export const updateTemplate = async (id: number, data: DemandTemplateDto) => {
  const response = await apiClient.put(`${apiBaseUrl}/api/demand-template/${id}`, data)
  return response.data
}

/**
 * 删除模板
 */
export const deleteTemplate = async (id: number) => {
  const response = await apiClient.delete(`${apiBaseUrl}/api/demand-template/${id}`)
  return response.data
}

/**
 * 获取启用的模板(学生端)
 */
export const getActiveTemplates = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/demand-template/active`)
  return response.data
}