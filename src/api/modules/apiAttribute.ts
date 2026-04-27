import apiClient from '@common/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

// ==================== 类型定义 ====================

export interface RuleAttribute {
  id?: number
  attributeCode: string
  attributeType: 'CONDITION' | 'TRANSFORM'
  attributeValue: string
  
  // ✅ 重命名字段
  inputMax?: number
  inputMin?: number
  inputInterval?: 'OPEN' | 'CLOSED' | 'LEFT_OPEN' | 'RIGHT_OPEN'
  
  displayOrder?: number
  description?: string
  isActive?: boolean
}

export interface AttributeGroupForm {
  attributeCode: string
  attributeType: 'CONDITION' | 'TRANSFORM'
  attributes: AttributeItem[]
}

export interface AttributeItem {
  id?: number
  attributeValue: string
  
  // ✅ 重命名字段
  inputMax?: number | null
  inputMin?: number | null
  inputInterval?: string
  
  displayOrder?: number
  description?: string
}

export interface AttributeTreeNode {
  key: string
  attributeCode: string
  attributeType?: string
  isChild: boolean
  hasChildren?: boolean
  children?: AttributeTreeNode[]
  
  // 子节点额外字段
  id?: number
  attributeValue?: string
  
  // ✅ 重命名字段
  inputMax?: number
  inputMin?: number
  inputInterval?: string
  
  description?: string
}

// ==================== API 请求 ====================

export const getAllAttributes = async () => {
  return await apiClient.get(`${apiBaseUrl}/api/rule-attribute/list`)
}

export const getAttributesByType = async (type: 'CONDITION' | 'TRANSFORM') => {
  return await apiClient.get(`${apiBaseUrl}/api/rule-attribute/list-by-type/${type}`)
}

export const getAttributesByCode = async (code: string) => {
  return await apiClient.get(`${apiBaseUrl}/api/rule-attribute/list-by-code/${code}`)
}

export const createAttribute = async (data: RuleAttribute) => {
  return await apiClient.post(`${apiBaseUrl}/api/rule-attribute/create`, data)
}

export const updateAttribute = async (id: number, data: RuleAttribute) => {
  return await apiClient.put(`${apiBaseUrl}/api/rule-attribute/${id}`, data)
}

export const deleteAttribute = async (id: number) => {
  return await apiClient.delete(`${apiBaseUrl}/api/rule-attribute/${id}`)
}

export const deleteAttributesByCode = async (code: string) => {
  const response = await getAttributesByCode(code)
  if (response.code === 200) {
    const attrs = response.data
    for (const attr of attrs) {
      await deleteAttribute(attr.id)
    }
  }
  return response
}
