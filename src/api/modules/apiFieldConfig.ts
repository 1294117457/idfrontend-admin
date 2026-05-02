import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface FieldConfig {
  id: number
  fieldKey: string
  displayName: string
  fieldType: 'SCORE' | 'DEMAND'
  maxScore?: number
  conditions?: string
  description?: string
  collegeCode?: string
  academicYear?: number
  sortOrder: number
  isActive: boolean
}

export interface FieldSubcategory {
  id: number
  fieldId: number
  subKey: string
  displayName: string
  maxScore: number
  description?: string
  sortOrder: number
  isActive: boolean
}

export const getFieldConfigList = async (type?: 'SCORE' | 'DEMAND'): Promise<ApiResponse<any>> => {
  return await apiClient.get(
    '/api/field-config/list',
    { params: type ? { type } : {} }
  )
}

export const getAllFieldConfigs = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/field-config/list/all')
}

export const getScoreFieldConfigs = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get(
    '/api/field-config/list',
    { params: { type: 'SCORE' } }
  )
}

export const createFieldConfig = async (data: Omit<FieldConfig, 'id'>): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/field-config', data)
}

export const updateFieldConfig = async (id: number, data: Partial<FieldConfig>): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/field-config/${id}`, data)
}

export const deleteFieldConfig = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/field-config/${id}`)
}

export const getSubcategoryList = async (fieldId?: number): Promise<ApiResponse<any>> => {
  return await apiClient.get(
    '/api/field-config/subcategory/list',
    { params: fieldId ? { fieldId } : {} }
  )
}

export const createSubcategory = async (data: Omit<FieldSubcategory, 'id'>): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/field-config/subcategory', data)
}

export const updateSubcategory = async (id: number, data: Partial<FieldSubcategory>): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/field-config/subcategory/${id}`, data)
}

export const deleteSubcategory = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/field-config/subcategory/${id}`)
}
