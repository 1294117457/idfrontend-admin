import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface RuleAttribute {
  id?: number
  attributeCode: string
  attributeType: 'CONDITION' | 'TRANSFORM'
  attributeValue: string
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
  id?: number
  attributeValue?: string
  inputMax?: number
  inputMin?: number
  inputInterval?: string
  description?: string
}

export const getAllAttributes = async (): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/rule-attribute/list')
}

export const getAttributesByType = async (type: 'CONDITION' | 'TRANSFORM'): Promise<ApiResponse<any>> => {
  return await apiClient.get(`/api/rule-attribute/list-by-type/${type}`)
}

export const getAttributesByCode = async (code: string): Promise<ApiResponse<any>> => {
  return await apiClient.get(`/api/rule-attribute/list-by-code/${code}`)
}

export const createAttribute = async (data: RuleAttribute): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/rule-attribute/create', data)
}

export const updateAttribute = async (id: number, data: RuleAttribute): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/rule-attribute/${id}`, data)
}

export const deleteAttribute = async (id: number): Promise<ApiResponse<any>> => {
  return await apiClient.delete(`/api/rule-attribute/${id}`)
}

export const deleteAttributesByCode = async (code: string): Promise<ApiResponse<any>> => {
  const response = await getAttributesByCode(code)
  if (response.code === 200) {
    const attrs = response.data
    for (const attr of attrs) {
      await deleteAttribute(attr.id)
    }
  }
  return response
}
