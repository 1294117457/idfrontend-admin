import apiClient from '@common/utils/http'

const apiBaseUrl = import.meta.env.VITE_BASE_API

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface KnowledgeFile {
  sourceFile: string
  chunkCount: number
}

export interface UploadResult {
  fileName: string
  chunkCount: number
  textLength?: number
  status: 'success' | 'parse_empty' | 'process_failed'
}

export interface KnowledgeStats {
  totalFiles: number
  totalChunks: number
  files: KnowledgeFile[]
}

export interface AIConfig {
  systemRole: string
  apiKey: string
  baseUrl: string
  chatModel: string
  embeddingModel: string
  contextMaxMessages: number
}

export interface AIConfigUpdate {
  systemRole?: string
  apiKey?: string
  baseUrl?: string
  chatModel?: string
  embeddingModel?: string
  contextMaxMessages?: number
}

export interface AgentSSEEvent {
  type: 'token' | 'interrupt' | 'result' | 'error' | 'session'
  data: any
}

export interface AgentResult {
  interrupted?: boolean
  question?: string
  reply: string
  intent: string
  documentText?: string
  suggestions?: any[]
  sessionId?: string
}

export interface AgentStreamCallbacks {
  onToken?: (content: string) => void
  onInterrupt?: (question: string) => void
  onResult?: (result: AgentResult) => void
  onSession?: (sessionId: string) => void
  onError?: (message: string) => void
  onDone?: () => void
}

// ─── 知识库 ────────────────────────────────────────────────────────────

export const listKnowledge = async (): Promise<ApiResponse<KnowledgeFile[]>> => {
  return await apiClient.get(`${apiBaseUrl}/api/aichat/knowledge/list`)
}

export const getKnowledgeStats = async (): Promise<ApiResponse<KnowledgeStats>> => {
  return await apiClient.get(`${apiBaseUrl}/api/aichat/knowledge/stats`)
}

export const uploadKnowledge = async (file: File): Promise<ApiResponse<UploadResult>> => {
  const formData = new FormData()
  formData.append('file', file)
  return await apiClient.post(`${apiBaseUrl}/api/aichat/knowledge/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  })
}

export const deleteKnowledge = async (sourceFile: string): Promise<ApiResponse<void>> => {
  return await apiClient.delete(`${apiBaseUrl}/api/aichat/knowledge/${encodeURIComponent(sourceFile)}`)
}

// ─── AI 配置 ────────────────────────────────────────────────────────────

export const getAIConfig = async (): Promise<ApiResponse<AIConfig>> => {
  return await apiClient.get(`${apiBaseUrl}/api/aichat/config`)
}

export const updateAIConfig = async (config: AIConfigUpdate): Promise<ApiResponse<void>> => {
  return await apiClient.put(`${apiBaseUrl}/api/aichat/config`, config)
}

// ─── Agent 流式对话 ────────────────────────────────────────────────────────────

async function consumeSSE(response: Response, callbacks?: AgentStreamCallbacks) {
  if (!response.ok || !response.body) {
    callbacks?.onError?.(`请求失败: ${response.status}`)
    callbacks?.onDone?.()
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
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.replace(/^data:\s*/, '').trim()
      if (payload === '[DONE]') { callbacks?.onDone?.(); return }
      try {
        const event: AgentSSEEvent = JSON.parse(payload)
        switch (event.type) {
          case 'token':    callbacks?.onToken?.(event.data.content); break
          case 'interrupt': callbacks?.onInterrupt?.(event.data.question); break
          case 'result':   callbacks?.onResult?.(event.data); break
          case 'session':  callbacks?.onSession?.(event.data.sessionId); break
          case 'error':    callbacks?.onError?.(event.data.message); break
        }
      } catch { /* skip malformed */ }
    }
  }
  callbacks?.onDone?.()
}

export function agentStreamChat(
  message: string, sessionId: string, file?: File, callbacks?: AgentStreamCallbacks,
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('accessToken') || ''
  const formData = new FormData()
  formData.append('message', message)
  formData.append('sessionId', sessionId)
  if (file) formData.append('file', file)

  fetch(`${apiBaseUrl}/api/aichat/stream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    signal: controller.signal,
  })
    .then(resp => consumeSSE(resp, callbacks))
    .catch(err => {
      if (err.name !== 'AbortError') callbacks?.onError?.(String(err))
      callbacks?.onDone?.()
    })
  return controller
}

export function agentResumeStream(
  sessionId: string, supplement: string, callbacks?: AgentStreamCallbacks,
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('accessToken') || ''

  fetch(`${apiBaseUrl}/api/aichat/resume-stream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, supplement }),
    signal: controller.signal,
  })
    .then(resp => consumeSSE(resp, callbacks))
    .catch(err => {
      if (err.name !== 'AbortError') callbacks?.onError?.(String(err))
      callbacks?.onDone?.()
    })
  return controller
}
