import apiClient from '@common/utils/http'

export interface FieldConfig {
  id: number
  fieldKey: string
  displayName: string
  fieldType: 'SCORE' | 'DEMAND'
  maxScore?: number
  conditions?: string  // JSON string
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

// ==================== Field Config ====================

export const getFieldConfigList = async (type?: 'SCORE' | 'DEMAND') => {
  const response = await apiClient.get<{ code: number; msg: string; data: FieldConfig[] }>(
    '/api/field-config/list',
    { params: type ? { type } : {} }
  )
  return response.data
}

export const getAllFieldConfigs = async () => {
  const response = await apiClient.get<{ code: number; msg: string; data: FieldConfig[] }>(
    '/api/field-config/list/all'
  )
  return response.data
}

export const getScoreFieldConfigs = async () => {
  const response = await apiClient.get<{ code: number; msg: string; data: FieldConfig[] }>(
    '/api/field-config/list',
    { params: { type: 'SCORE' } }
  )
  return response.data
}

export const createFieldConfig = async (data: Omit<FieldConfig, 'id'>) => {
  const response = await apiClient.post<{ code: number; msg: string; data: number }>(
    '/api/field-config',
    data
  )
  return response.data
}

export const updateFieldConfig = async (id: number, data: Partial<FieldConfig>) => {
  const response = await apiClient.put<{ code: number; msg: string; data: null }>(
    `/api/field-config/${id}`,
    data
  )
  return response.data
}

export const deleteFieldConfig = async (id: number) => {
  const response = await apiClient.delete<{ code: number; msg: string; data: null }>(
    `/api/field-config/${id}`
  )
  return response.data
}

// ==================== Field Subcategory ====================

export const getSubcategoryList = async (fieldId?: number) => {
  const response = await apiClient.get<{ code: number; msg: string; data: FieldSubcategory[] }>(
    '/api/field-config/subcategory/list',
    { params: fieldId ? { fieldId } : {} }
  )
  return response.data
}

export const createSubcategory = async (data: Omit<FieldSubcategory, 'id'>) => {
  const response = await apiClient.post<{ code: number; msg: string; data: number }>(
    '/api/field-config/subcategory',
    data
  )
  return response.data
}

export const updateSubcategory = async (id: number, data: Partial<FieldSubcategory>) => {
  const response = await apiClient.put<{ code: number; msg: string; data: null }>(
    `/api/field-config/subcategory/${id}`,
    data
  )
  return response.data
}

export const deleteSubcategory = async (id: number) => {
  const response = await apiClient.delete<{ code: number; msg: string; data: null }>(
    `/api/field-config/subcategory/${id}`
  )
  return response.data
}
