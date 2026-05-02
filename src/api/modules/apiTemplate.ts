import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface ScoringRule {
  id?: number
  ruleType: 'CONDITION' | 'TRANSFORM'
  ruleScore?: number
  priority: number
  attributeIds?: number[]
}

export interface BonusTemplate {
  id?: number
  templateName: string
  templateType: 'CONDITION' | 'TRANSFORM'
  scoreType?: number
  fieldId?: number
  templateMaxScore: number
  inputUnit?: string
  description: string
  reviewCount?: number
  rules: ScoringRule[]
}

export const getTemplateList = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/bonus-template/list')
}

export const createTemplate = async (data: BonusTemplate): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/bonus-template/create', data)
}

export const updateTemplate = async (id: number, data: BonusTemplate): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/bonus-template/${id}`, data)
}

export const deleteTemplate = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/bonus-template/${id}`)
}

export const getTemplateDetail = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.get(`/api/bonus-template/${id}`)
}
