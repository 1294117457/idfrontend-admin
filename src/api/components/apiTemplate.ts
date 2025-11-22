import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

export interface ScoringRule {
  id?: number
  ruleName: string
  conditions: string  // JSON字符串
  scorePercentage: number  // 得分比例 0-100
  priority: number
  description?: string
}

export interface BonusTemplate {
  id?: string
  templateName: string
  scoreType: number
  maxScore: number
  description: string
  rules: ScoringRule[]
}

export const getTemplateList = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-template/list`)
  return response.data
}

export const createTemplate = async (data: BonusTemplate) => {
  const response = await apiClient.post(`${apiBaseUrl}/api/bonus-template/create`, data)
  return response.data
}

// 新增：更新模板
export const updateTemplate = async (id: string, data: BonusTemplate) => {
  const response = await apiClient.put(`${apiBaseUrl}/api/bonus-template/${id}`, data)
  return response.data
}

export const deleteTemplate = async (id: string) => {
  const response = await apiClient.delete(`${apiBaseUrl}/api/bonus-template/${id}`)
  return response.data
}

export const getTemplateDetail = async (id: string) => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-template/${id}`)
  return response.data
}