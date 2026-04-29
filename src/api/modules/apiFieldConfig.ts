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
  return await apiClient.get(
    '/api/field-config/list',
    { params: type ? { type } : {} }
  )
}

export const getAllFieldConfigs = async () => {
  return await apiClient.get('/api/field-config/list/all')
}

export const getScoreFieldConfigs = async () => {
  return await apiClient.get(
    '/api/field-config/list',
    { params: { type: 'SCORE' } }
  )
}

export const createFieldConfig = async (data: Omit<FieldConfig, 'id'>) => {
  return await apiClient.post('/api/field-config', data)
}

export const updateFieldConfig = async (id: number, data: Partial<FieldConfig>) => {
  return await apiClient.put(`/api/field-config/${id}`, data)
}

export const deleteFieldConfig = async (id: number) => {
  return await apiClient.delete(`/api/field-config/${id}`)
}

// ==================== Field Subcategory ====================

export const getSubcategoryList = async (fieldId?: number) => {
  return await apiClient.get(
    '/api/field-config/subcategory/list',
    { params: fieldId ? { fieldId } : {} }
  )
}

export const createSubcategory = async (data: Omit<FieldSubcategory, 'id'>) => {
  return await apiClient.post('/api/field-config/subcategory', data)
}

export const updateSubcategory = async (id: number, data: Partial<FieldSubcategory>) => {
  return await apiClient.put(`/api/field-config/subcategory/${id}`, data)
}

export const deleteSubcategory = async (id: number) => {
  return await apiClient.delete(`/api/field-config/subcategory/${id}`)
}
