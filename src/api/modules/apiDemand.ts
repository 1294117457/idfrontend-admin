import apiClient from '@common/utils/http'
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
  return await apiClient.get(`${apiBaseUrl}/api/demand-template/list`)
}

/**
 * 创建模板
 */
export const createTemplate = async (data: DemandTemplateDto) => {
  return await apiClient.post(`${apiBaseUrl}/api/demand-template/create`, data)
}

/**
 * 更新模板
 */
export const updateTemplate = async (id: number, data: DemandTemplateDto) => {
  return await apiClient.put(`${apiBaseUrl}/api/demand-template/${id}`, data)
}

/**
 * 删除模板
 */
export const deleteTemplate = async (id: number) => {
  return await apiClient.delete(`${apiBaseUrl}/api/demand-template/${id}`)
}

/**
 * 获取启用的模板(学生端)
 */
export const getActiveTemplates = async () => {
  return await apiClient.get(`${apiBaseUrl}/api/demand-template/active`)
}
