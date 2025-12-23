import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

// ✅ 修改规则接口 (移除 ruleName 和 description)
export interface ScoringRule {
  id?: number
  ruleType: 'CONDITION' | 'TRANSFORM'
  ruleScore?: number
  priority: number
  attributeIds?: number[]
}

// ✅ 模板接口保持不变
export interface BonusTemplate {
  id?: number
  templateName: string
  templateType: 'CONDITION' | 'TRANSFORM'
  scoreType: number
  templateMaxScore: number
  description: string
  reviewCount?: number
  rules: ScoringRule[]
}

// ==================== 模板接口 ====================

export const getTemplateList = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-template/list`)
  return response.data
}

export const createTemplate = async (data: BonusTemplate) => {
  const response = await apiClient.post(`${apiBaseUrl}/api/bonus-template/create`, data)
  return response.data
}

export const updateTemplate = async (id: number, data: BonusTemplate) => {
  const response = await apiClient.put(`${apiBaseUrl}/api/bonus-template/${id}`, data)
  return response.data
}

export const deleteTemplate = async (id: number) => {
  const response = await apiClient.delete(`${apiBaseUrl}/api/bonus-template/${id}`)
  return response.data
}

export const getTemplateDetail = async (id: number) => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-template/${id}`)
  return response.data
}