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
  const response = await apiClient.post(`${apiBaseUrl}/api/chat/send`, { message }, { timeout: 120000 })
  return response.data
}

/**
 * 流式发送消息（SSE）
 * 返回 AbortController，调用 .abort() 可中断请求
 */
export const sendMessageStream = (
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): AbortController => {
  const controller = new AbortController()
  const token = localStorage.getItem('accessToken')

  const run = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        onError('网络异常')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()   // 兼容 "data:x" 和 "data: x"
          if (data === '[DONE]') { onDone(); return }
          try {
            const parsed = JSON.parse(data)
            if (parsed.token) onToken(parsed.token)
            if (parsed.error) { onError(parsed.error); return }
          } catch { /* 忽略非 JSON 行 */ }
        }
      }
      onDone()
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      onError('网络异常，请检查连接')
    }
  }

  run()
  return controller
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

/** AI 配置 */
export interface AIConfig {
  systemRole: string
  apiKey: string
  baseUrl: string
  chatModel: string
  embeddingModel: string
}

export interface AIConfigUpdate {
  systemRole?: string
  apiKey?: string
  baseUrl?: string
  chatModel?: string
  embeddingModel?: string
}

/** 获取 AI 配置（apiKey 掩码显示） */
export const getAIConfig = async (): Promise<ApiResponse<AIConfig>> => {
  const response = await apiClient.get(`${apiBaseUrl}/api/ai-config`)
  return response.data
}

/** 更新 AI 配置 */
export const updateAIConfig = async (config: AIConfigUpdate): Promise<ApiResponse<void>> => {
  const response = await apiClient.put(`${apiBaseUrl}/api/ai-config`, config)
  return response.data
}
