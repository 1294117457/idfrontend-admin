import apiClient from '@common/utils/http'
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
  scoreType?: number
  fieldId?: number
  templateMaxScore: number
  inputUnit?: string
  description: string
  reviewCount?: number
  rules: ScoringRule[]
}

// ==================== 模板接口 ====================

export const getTemplateList = async () => {
  return await apiClient.get(`${apiBaseUrl}/api/bonus-template/list`)
}

export const createTemplate = async (data: BonusTemplate) => {
  return await apiClient.post(`${apiBaseUrl}/api/bonus-template/create`, data)
}

export const updateTemplate = async (id: number, data: BonusTemplate) => {
  return await apiClient.put(`${apiBaseUrl}/api/bonus-template/${id}`, data)
}

export const deleteTemplate = async (id: number) => {
  return await apiClient.delete(`${apiBaseUrl}/api/bonus-template/${id}`)
}

export const getTemplateDetail = async (id: number) => {
  return await apiClient.get(`${apiBaseUrl}/api/bonus-template/${id}`)
}
