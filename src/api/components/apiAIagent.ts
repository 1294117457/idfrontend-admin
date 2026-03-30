import apiClient from '@/utils/http'

const apiBaseUrl = import.meta.env.VITE_BASE_API

/** 通用响应 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/** 知识库文件条目 */
export interface KnowledgeFile {
  sourceFile: string
  chunkCount: number
}

/** 发送消息 */
export const sendMessage = async (message: string): Promise<ApiResponse<string>> => {
  const response = await apiClient.post(`${apiBaseUrl}/api/chat/send`, { message })
  return response.data
}

/** 清除对话历史 */
export const clearConversation = async (): Promise<ApiResponse<void>> => {
  const response = await apiClient.post(`${apiBaseUrl}/api/chat/clear`)
  return response.data
}

/** 获取知识库文件列表 */
export const listKnowledge = async (): Promise<ApiResponse<KnowledgeFile[]>> => {
  const response = await apiClient.get(`${apiBaseUrl}/api/knowledge/list`)
  return response.data
}

/** 上传知识库文件 */
export const uploadKnowledge = async (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post(`${apiBaseUrl}/api/knowledge/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return response.data
}

/** 删除知识库文件 */
export const deleteKnowledge = async (sourceFile: string): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`${apiBaseUrl}/api/knowledge/${encodeURIComponent(sourceFile)}`)
  return response.data
}
