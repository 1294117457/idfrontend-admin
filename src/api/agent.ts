// ─── Agent 直连 API — 前端直接连接 Agent，跳过后端代理 ────────────────────────────
// 所有接口均返回 { code, msg, data } 格式

const agentBaseUrl = import.meta.env.VITE_AGENT_BASE_URL

// ── 通用响应类型 ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ── SSE 事件类型 ─────────────────────────────────────────────────────────────

export interface AgentSSEEvent {
  type: 'token' | 'interrupt' | 'result' | 'error' | 'session' | 'context_compressed'
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
  onInterrupt?: (question: string, extra?: { suggestions?: any[]; requireFiles?: boolean }) => void
  onContextLimit?: (message: string) => void
  onResult?: (result: AgentResult) => void
  onSession?: (sessionId: string) => void
  onError?: (message: string) => void
  onDone?: () => void
}

// ── SSE 消费函数 ─────────────────────────────────────────────────────────────

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
          case 'token':              callbacks?.onToken?.(event.data.content); break
          case 'interrupt':          callbacks?.onInterrupt?.(event.data.question, event.data); break
          case 'context_compressed': callbacks?.onContextLimit?.(event.data.message); break
          case 'result':             callbacks?.onResult?.(event.data); break
          case 'session':            callbacks?.onSession?.(event.data.sessionId); break
          case 'error':             callbacks?.onError?.(event.data.message); break
        }
      } catch { /* skip malformed */ }
    }
  }
  callbacks?.onDone?.()
}

// ── Agent 流式对话 ───────────────────────────────────────────────────────────

export function agentStreamChat(
  message: string,
  sessionId: string,
  file?: File,
  callbacks?: AgentStreamCallbacks,
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('accessToken') || ''
  const formData = new FormData()
  formData.append('message', message)
  formData.append('sessionId', sessionId)
  if (file) formData.append('file', file)

  fetch(`${agentBaseUrl}/ai/agent/stream`, {
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
  sessionId: string,
  supplement: string,
  callbacks?: AgentStreamCallbacks,
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('accessToken') || ''

  fetch(`${agentBaseUrl}/ai/agent/resume-stream`, {
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

// ── 会话持久化 API ──────────────────────────────────────────────────────────

export interface ConversationMeta {
  id: number
  user_id: string
  session_id: string
  title: string
  status: number
  is_deleted: number
  created_at: string
  updated_at: string
  message_count: number
  last_message: string | null
}

export interface MessageRecord {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'interrupt'
  content: string
  msg_type: string
  extra_data: string | null
  created_at: string
}

async function agentFetch(path: string, options: RequestInit = {}): Promise<ApiResponse<any>> {
  const token = localStorage.getItem('accessToken') || ''
  const resp = await fetch(`${agentBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {}),
    },
  })
  return await resp.json()
}

export const getConversationsApi = async (limit = 50, offset = 0): Promise<ApiResponse<{ list: ConversationMeta[]; total: number }>> => {
  return await agentFetch(`/ai/conversation/list?limit=${limit}&offset=${offset}`)
}

export const searchConversationsApi = async (keyword: string): Promise<ApiResponse<ConversationMeta[]>> => {
  return await agentFetch(`/ai/conversation/search?keyword=${encodeURIComponent(keyword)}`)
}

export const createConversationApi = async (firstMessage = ''): Promise<ApiResponse<{ id: number; sessionId: string; title: string }>> => {
  return await agentFetch('/ai/conversation/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstMessage }),
  })
}

export const getConversationApi = async (sessionId: string): Promise<ApiResponse<ConversationMeta>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}`)
}

export const getMessagesApi = async (sessionId: string): Promise<ApiResponse<MessageRecord[]>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}/messages`)
}

export const updateConversationTitleApi = async (sessionId: string, title: string): Promise<ApiResponse<void>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

export const archiveConversationApi = async (sessionId: string): Promise<ApiResponse<void>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}/archive`, { method: 'POST' })
}

export const deleteConversationApi = async (sessionId: string): Promise<ApiResponse<void>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
}

export const clearMessagesApi = async (sessionId: string): Promise<ApiResponse<void>> => {
  return await agentFetch(`/ai/conversation/${encodeURIComponent(sessionId)}/messages`, { method: 'DELETE' })
}

// ── 知识库 API ──────────────────────────────────────────────────────────────

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

export const listKnowledgeApi = async (): Promise<ApiResponse<KnowledgeFile[]>> => {
  return await agentFetch('/ai/knowledge/list')
}

export const getKnowledgeStatsApi = async (): Promise<ApiResponse<KnowledgeStats>> => {
  return await agentFetch('/ai/knowledge/stats')
}

export const uploadKnowledgeApi = async (file: File): Promise<ApiResponse<UploadResult>> => {
  const token = localStorage.getItem('accessToken') || ''
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(`${agentBaseUrl}/ai/knowledge/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  return await resp.json()
}

export const deleteKnowledgeApi = async (sourceFile: string): Promise<ApiResponse<void>> => {
  return await agentFetch(`/ai/knowledge/${encodeURIComponent(sourceFile)}`, { method: 'DELETE' })
}

// ── AI 配置 API ─────────────────────────────────────────────────────────────

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

export const getAIConfigApi = async (): Promise<ApiResponse<AIConfig>> => {
  return await agentFetch('/ai/config/')
}

export const updateAIConfigApi = async (config: AIConfigUpdate): Promise<ApiResponse<void>> => {
  return await agentFetch('/ai/config/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
}
