import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

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

export const getAllTemplates = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/demand-template/list')
}

export const createTemplate = async (data: DemandTemplateDto): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/demand-template/create', data)
}

export const updateTemplate = async (id: number, data: DemandTemplateDto): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/demand-template/${id}`, data)
}

export const deleteTemplate = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/demand-template/${id}`)
}

export const getActiveTemplates = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/demand-template/active')
}
