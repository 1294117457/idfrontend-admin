<template>
    <div>
      <!-- 悬浮按钮（可拖拽） -->
      <div
        ref="floatButton"
        class="ai-float-button fixed z-[9999] cursor-pointer group"
        :class="{ 'cursor-grabbing': isDragging }"
        :style="{ right: position.right + 'px', bottom: position.bottom + 'px' }"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <!-- 悬浮提示文字 -->
        <div
          v-if="!isDragging"
          class="absolute bottom-16 right-0 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        >
          我是AI助手抽成龟，可以帮助您了解如何使用这个系统
          <div class="absolute -bottom-1 right-6 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
  
        <div
          class="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 overflow-hidden border-2 border-white"
          :class="{ 'scale-110 shadow-2xl': isDragging }"
          @click="handleClick"
        >
          <!-- 使用头像图片 -->
          <img
            v-if="!isOpen"
            src="@/assets/images/avatar.png"
            alt="抽成龟"
            class="w-full h-full object-cover"
            @error="handleAvatarError"
          />
          <!-- 如果图片加载失败，显示备用图标 -->
          <div
            v-if="avatarError && !isOpen"
            class="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <span class="text-white text-lg font-bold">龟</span>
          </div>
          <!-- 关闭图标 -->
          <div
            v-if="isOpen"
            class="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <!-- 未读提示 -->
        <div
          v-if="hasNewMessage && !isOpen"
          class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"
        />
        
        <!-- 拖拽提示（首次显示） -->
        <div
          v-if="showDragTip && !isDragging"
          class="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-bounce"
        >
          可拖拽移动
        </div>
      </div>
  
      <!-- 对话框 -->
      <Transition name="slide-up">
        <div
          v-if="isOpen"
          class="ai-assistant-panel fixed z-[9998] w-[min(24rem,calc(100vw-1.5rem))] h-[min(500px,calc(100dvh-6rem))] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/70"
          :style="dialogPosition"
        >
          <!-- 头部 -->
          <div
            class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <!-- 头部头像 -->
              <div class="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                <img
                  src="@/assets/images/avatar.png"
                  alt="抽成龟"
                  class="w-full h-full object-cover"
                  @error="handleHeaderAvatarError"
                />
                <div
                  v-if="headerAvatarError"
                  class="w-full h-full bg-white/20 flex items-center justify-center"
                >
                  <span class="text-xs font-bold">龟</span>
                </div>
              </div>
              <span class="font-semibold">抽成龟</span>
            </div>
            <div class="flex items-center gap-2">
              <!-- 会话列表按钮 -->
              <button
                @click="toggleHistory"
                class="text-white/80 hover:text-white text-sm flex items-center gap-1"
                title="历史会话"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <!-- 新建对话按钮 -->
              <button
                @click="handleNewConversation"
                class="text-white/80 hover:text-white text-sm flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4v16m8-8H4" />
                </svg>
                新对话
              </button>
            </div>
          </div>

          <!-- 会话历史侧边栏 -->
          <div v-if="isHistoryOpen" class="flex flex-col overflow-hidden" style="height: calc(100% - 56px)">
            <!-- 搜索栏 -->
            <div class="px-3 py-2 border-b border-slate-100">
              <input
                v-model="searchKeyword"
                @keyup.enter="handleSearch"
                type="text"
                placeholder="搜索历史对话..."
                class="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <!-- 会话列表 -->
            <div class="flex-1 overflow-y-auto">
              <div v-if="isLoadingHistory" class="flex justify-center py-6 text-sm text-gray-400">
                加载中...
              </div>
              <div v-else-if="displayConversations.length === 0" class="flex justify-center py-6 text-sm text-gray-400">
                暂无历史对话
              </div>
              <div v-else>
                <div
                  v-for="conv in displayConversations"
                  :key="conv.session_id"
                  @click="handleSelectConversation(conv)"
                  class="px-3 py-2.5 border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="{ 'bg-blue-50 border-l-2 border-l-blue-500': currentSessionId === conv.session_id }"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-slate-800 truncate max-w-[60%]">
                      {{ conv.title }}
                    </span>
                    <div class="flex items-center gap-1">
                      <span class="text-xs text-gray-400">{{ formatTime(conv.updated_at) }}</span>
                      <button
                        @click.stop="handleDeleteConversation(conv)"
                        class="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                        title="删除"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="text-xs text-gray-400 mt-0.5 truncate">
                    {{ conv.last_message || '新对话' }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 关闭按钮 -->
            <div class="px-3 py-2 border-t border-slate-100">
              <button
                @click="isHistoryOpen = false"
                class="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
              >
                关闭
              </button>
            </div>
          </div>

          <!-- 消息列表（仅在非历史模式时显示） -->
          <div v-if="!isHistoryOpen" ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="text-center text-gray-400 mt-8">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-200">
                <img
                  src="@/assets/images/avatar.png"
                  alt="抽成龟"
                  class="w-full h-full object-cover"
                />
              </div>
              <p class="text-sm font-medium text-gray-600">你好！我是抽成龟</p>
              <p class="text-xs mt-1">可以帮助您了解如何使用这个系统</p>
            </div>
  
            <!-- 消息气泡 -->
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
            >
              <!-- AI消息带头像 -->
              <div v-if="msg.role === 'assistant' && msg.content" class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  <img
                    src="@/assets/images/avatar.png"
                    alt="抽成龟"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="max-w-[75%] px-4 py-2 rounded-2xl text-sm bg-gray-100 text-gray-800 rounded-bl-md">
                  <div class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                </div>
              </div>
              <!-- interrupt 补充信息气泡 -->
              <div v-else-if="msg.role === 'interrupt'" class="flex items-start gap-2 w-full">
                <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  <img src="@/assets/images/avatar.png" alt="抽成龟" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 max-w-[85%]">
                  <div class="px-4 py-2 rounded-2xl text-sm bg-amber-50 text-amber-800 rounded-bl-md border border-amber-200">
                    <div class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                  </div>
                  <div v-if="isInterrupted" class="mt-2 flex gap-2">
                    <input
                      v-model="supplementInput"
                      @keyup.enter="handleResume"
                      type="text"
                      placeholder="请补充信息..."
                      class="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      @click="handleResume"
                      :disabled="!supplementInput.trim()"
                      class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                    >
                      提交
                    </button>
                  </div>
                </div>
              </div>
              <!-- 用户消息 -->
               
              <div
                 v-else-if="msg.role === 'user'"
                class="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-blue-500 text-white rounded-br-md"
              >
                <div class="whitespace-pre-wrap">{{ msg.content }}</div>
              </div>
            </div>
  
            <!-- 加载动画：仅等待首 token 阶段显示 -->
            <div v-if="isLoading && !isStreaming" class="flex justify-start">
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  <img
                    src="@/assets/images/avatar.png"
                    alt="抽成龟"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s" />
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 文件预览 -->
          <div v-if="pendingFile && !isHistoryOpen" class="px-3 pt-2 flex items-center gap-2 text-xs text-gray-500">
            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span class="truncate max-w-[200px]">{{ pendingFile.name }}</span>
            <button @click="pendingFile = null" class="text-red-400 hover:text-red-600 ml-auto">&times;</button>
          </div>

          <!-- 输入区域 -->
          <div v-if="!isHistoryOpen" class="border-t p-3">
            <div class="flex items-center gap-2">
              <label class="w-8 h-8 flex items-center justify-center cursor-pointer text-gray-400 hover:text-blue-500 transition-colors" title="上传文件">
                <input ref="fileInput" type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md" class="hidden" @change="onFileSelected" />
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </label>
              <input
                v-model="inputMessage"
                @keyup.enter="handleSend"
                type="text"
                placeholder="输入消息..."
                class="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="isLoading"
              />
              <button
                @click="handleSend"
                :disabled="isLoading || (!inputMessage.trim() && !pendingFile)"
                class="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
  import { agentStreamChat, agentResumeStream } from '@/api/agent'
  import type { AgentStreamCallbacks } from '@/api/agent'
  import {
    getConversationsApi,
    createConversationApi,
    getMessagesApi,
    deleteConversationApi,
    searchConversationsApi,
    type ConversationMeta,
    type MessageRecord,
  } from '@/api/agent'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'

  marked.setOptions({ breaks: true, gfm: true })

  function renderMarkdown(text: string): string {
    if (!text) return ''
    const html = marked.parse(text) as string
    return DOMPurify.sanitize(html)
  }
  
  interface Message {
    role: 'user' | 'assistant' | 'interrupt'
    content: string
  }
  
  // ==================== 拖拽相关状态 ====================
  const floatButton = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const showDragTip = ref(true)
  const hasDragged = ref(false)
  
  const position = reactive({
    right: 32,
    bottom: 32
  })
  
  const dragStart = reactive({
    x: 0, y: 0, right: 0, bottom: 0
  })
  
  const dialogPosition = computed(() => {
    const dialogWidth = typeof window !== 'undefined' ? Math.min(384, window.innerWidth - 24) : 384
    const dialogHeight = typeof window !== 'undefined' ? Math.min(500, window.innerHeight - 96) : 500
    const buttonSize = 56
    const gap = 16
    let right = position.right
    let bottom = position.bottom + buttonSize + gap
    if (typeof window !== 'undefined') {
      if (right < 0) right = 8
      if (right + dialogWidth > window.innerWidth) {
        right = Math.max(8, window.innerWidth - dialogWidth - 8)
      }
      if (bottom + dialogHeight > window.innerHeight) {
        bottom = position.bottom - dialogHeight - gap
        if (bottom < 0) bottom = 8
      }
    }
    return { right: right + 'px', bottom: bottom + 'px' }
  })
  
  const startDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    isDragging.value = true
    showDragTip.value = false
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.x = clientX; dragStart.y = clientY
    dragStart.right = position.right; dragStart.bottom = position.bottom
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  }
  
  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaX = dragStart.x - clientX
    const deltaY = dragStart.y - clientY
    const buttonSize = 56; const minMargin = 8
    let newRight = dragStart.right + deltaX
    let newBottom = dragStart.bottom + deltaY
    newRight = Math.max(minMargin, Math.min(window.innerWidth - buttonSize - minMargin, newRight))
    newBottom = Math.max(minMargin, Math.min(window.innerHeight - buttonSize - minMargin, newBottom))
    position.right = newRight; position.bottom = newBottom
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasDragged.value = true
  }
  
  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
    savePosition()
    setTimeout(() => { hasDragged.value = false }, 100)
  }
  
  const handleClick = () => { if (!hasDragged.value) toggleDialog() }
  
  const savePosition = () => { localStorage.setItem('ai-assistant-position', JSON.stringify(position)) }
  
  const loadPosition = () => {
    const saved = localStorage.getItem('ai-assistant-position')
    if (saved) {
      try {
        const pos = JSON.parse(saved)
        position.right = pos.right; position.bottom = pos.bottom
        showDragTip.value = false
      } catch (e) { console.error('加载位置失败', e) }
    }
  }
  
  // ==================== 会话管理状态 ====================
  const conversations = ref<ConversationMeta[]>([])
  const isHistoryOpen = ref(false)
  const isLoadingHistory = ref(false)
  const searchKeyword = ref('')
  const currentSessionId = ref<string>('')
  const currentConversationId = ref<number | null>(null)

  // ==================== 原有状态 ====================
  const isOpen = ref(false)
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const isInterrupted = ref(false)
  const hasNewMessage = ref(false)
  const inputMessage = ref('')
  const supplementInput = ref('')
  const pendingFile = ref<File | null>(null)
  const messages = ref<Message[]>([])
  const messageContainer = ref<HTMLElement | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)
  let streamController: AbortController | null = null
  
  // 头像加载错误状态
  const avatarError = ref(false)
  const headerAvatarError = ref(false)
  
  const handleAvatarError = () => { avatarError.value = true }
  const handleHeaderAvatarError = () => { headerAvatarError.value = true }
  
  const toggleDialog = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) hasNewMessage.value = false
  }
  
  const scrollToBottom = () => {
    nextTick(() => {
      if (messageContainer.value) messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    })
  }
  
  const onFileSelected = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files?.[0]) {
      pendingFile.value = target.files[0]
      target.value = ''
    }
  }

  const buildCallbacks = (aiMsgIndex: number): AgentStreamCallbacks => ({
    onSession(sid) { currentSessionId.value = sid },
    onToken(content) {
      isStreaming.value = true
      messages.value[aiMsgIndex].content += content
      scrollToBottom()
    },
    onInterrupt(question) {
      isInterrupted.value = true
      messages.value.push({ role: 'interrupt', content: question })
      scrollToBottom()
    },
    onResult(result) {
      if (result.reply && !messages.value[aiMsgIndex].content) {
        messages.value[aiMsgIndex].content = result.reply
        scrollToBottom()
      }
    },
    onError(msg) {
      if (!messages.value[aiMsgIndex].content) {
        messages.value[aiMsgIndex].content = '抱歉，遇到了一些问题，请稍后再试。'
      }
      console.error('SSE Error:', msg)
    },
    onDone() {
      isLoading.value = false
      isStreaming.value = false
      streamController = null
      scrollToBottom()
    },
  })

  const handleSend = () => {
    const message = inputMessage.value.trim()
    const file = pendingFile.value
    if ((!message && !file) || isLoading.value) return

    if (!currentSessionId.value) ensureConversation()

    const displayText = file ? (message ? `${message}\n📎 ${file.name}` : `📎 ${file.name}`) : message
    messages.value.push({ role: 'user', content: displayText })
    inputMessage.value = ''
    pendingFile.value = null
    isInterrupted.value = false
    scrollToBottom()

    messages.value.push({ role: 'assistant', content: '' })
    const aiMsgIndex = messages.value.length - 1
    isLoading.value = true
    isStreaming.value = false

    streamController = agentStreamChat(
      message, currentSessionId.value, file ?? undefined, buildCallbacks(aiMsgIndex),
    )
  }

  const handleResume = () => {
    const supplement = supplementInput.value.trim()
    if (!supplement || isLoading.value) return

    messages.value.push({ role: 'user', content: supplement })
    supplementInput.value = ''
    isInterrupted.value = false
    scrollToBottom()

    messages.value.push({ role: 'assistant', content: '' })
    const aiMsgIndex = messages.value.length - 1
    isLoading.value = true
    isStreaming.value = false

    streamController = agentResumeStream(
      currentSessionId.value, supplement, buildCallbacks(aiMsgIndex),
    )
  }

  const ensureConversation = async (firstMessage = ''): Promise<void> => {
    if (currentSessionId.value) return
    try {
      const res = await createConversationApi(firstMessage)
      const data = (res as any).data
      if (data && data.sessionId) {
        currentConversationId.value = data.id
        currentSessionId.value = data.sessionId
        localStorage.setItem('ai-last-session-id', currentSessionId.value)
      }
    } catch (e) { console.error('创建会话失败', e) }
  }

  const handleNewConversation = async () => {
    streamController?.abort()
    streamController = null
    messages.value = []
    isLoading.value = false
    isStreaming.value = false
    isInterrupted.value = false
    supplementInput.value = ''
    pendingFile.value = null
    currentSessionId.value = ''
    currentConversationId.value = null
    localStorage.removeItem('ai-last-session-id')
    isHistoryOpen.value = false
  }
  
  const loadConversations = async (keyword?: string) => {
    isLoadingHistory.value = true
    try {
      const res = keyword
        ? await searchConversationsApi(keyword)
        : await getConversationsApi()
      let list: ConversationMeta[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray((res as any).data?.list)) list = (res as any).data.list
      else if (res && Array.isArray((res as any).data)) list = (res as any).data
      conversations.value = list
    } catch (e) { console.error('加载会话列表失败', e) }
    finally { isLoadingHistory.value = false }
  }

  const toggleHistory = () => {
    isHistoryOpen.value = !isHistoryOpen.value
    if (isHistoryOpen.value) loadConversations()
  }

  const handleSearch = () => {
    if (searchKeyword.value.trim()) loadConversations(searchKeyword.value.trim())
    else loadConversations()
  }

  const handleSelectConversation = async (conv: ConversationMeta) => {
    streamController?.abort()
    streamController = null
    isLoadingHistory.value = true
    try {
      const res = await getMessagesApi(conv.session_id)
      let msgs: MessageRecord[] = []
      if (Array.isArray(res)) msgs = res
      else if (res && Array.isArray((res as any).data)) msgs = (res as any).data
      messages.value = msgs.map(m => ({
        role: m.role === 'user' ? 'user' : m.role === 'interrupt' ? 'interrupt' : 'assistant',
        content: m.content,
      }))
      currentSessionId.value = conv.session_id
      currentConversationId.value = conv.id
      localStorage.setItem('ai-last-session-id', conv.session_id)
    } catch (e) { console.error('加载历史对话失败', e) }
    finally { isLoadingHistory.value = false }
    isHistoryOpen.value = false
    isInterrupted.value = false
  }

  const handleDeleteConversation = async (conv: ConversationMeta) => {
    try {
      await deleteConversationApi(conv.session_id)
      conversations.value = conversations.value.filter(c => c.session_id !== conv.session_id)
      if (currentSessionId.value === conv.session_id) await handleNewConversation()
    } catch (e: any) { console.error('删除会话失败', e) }
  }
  
  watch(() => messages.value.length, () => {
    if (!isOpen.value && messages.value.length > 0) hasNewMessage.value = true
  })

  const formatTime = (iso: string): string => {
    const date = new Date(iso)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    const yesterday = new Date(now.getTime() - 86400000)
    if (date.toDateString() === yesterday.toDateString()) return '昨天'
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const displayConversations = computed(() => conversations.value)

  onMounted(async () => {
    loadPosition()

    // 恢复最后会话
    const lastSessionId = localStorage.getItem('ai-last-session-id')
    if (lastSessionId) {
      try {
        const res = await getMessagesApi(lastSessionId)
        let msgs: MessageRecord[] = []
        if (Array.isArray(res)) msgs = res
        else if (res && Array.isArray((res as any).data)) msgs = (res as any).data
        if (msgs.length > 0) {
          messages.value = msgs.map(m => ({
            role: m.role === 'user' ? 'user' : m.role === 'interrupt' ? 'interrupt' : 'assistant',
            content: m.content,
          }))
          currentSessionId.value = lastSessionId
        }
      } catch {
        localStorage.removeItem('ai-last-session-id')
      }
    }

    setTimeout(() => { showDragTip.value = false }, 3000)
  })

  onUnmounted(() => { streamController?.abort() })
  </script>
  
  <style scoped>
  .slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
  .slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  .cursor-grabbing { cursor: grabbing !important; user-select: none; }
  .ai-assistant-panel { max-width: calc(100vw - 24px); max-height: calc(100dvh - 96px); }
  @media (max-width: 640px) {
    .ai-float-button { right: max(14px, env(safe-area-inset-right)) !important; bottom: max(14px, env(safe-area-inset-bottom)) !important; }
    .ai-assistant-panel { right: 12px !important; bottom: 84px !important; width: calc(100vw - 24px) !important; height: min(72dvh, 500px) !important; border-radius: 18px; }
  }
  </style>
  <style>
  .markdown-body { font-size: 0.875rem; line-height: 1.6; word-break: break-word; }
  .markdown-body p { margin: 0.25em 0; }
  .markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin: 0.4em 0; }
  .markdown-body li { margin: 0.2em 0; }
  .markdown-body strong { font-weight: 600; }
  .markdown-body blockquote { border-left: 3px solid #d1d5db; padding-left: 0.75em; margin: 0.5em 0; color: #6b7280; }
  .markdown-body code { background: #f3f4f6; padding: 0.125em 0.375em; border-radius: 0.25em; font-size: 0.8em; }
  .markdown-body pre { background: #1f2937; color: #e5e7eb; padding: 0.75em 1em; border-radius: 0.5em; overflow-x: auto; margin: 0.5em 0; }
  .markdown-body pre code { background: none; padding: 0; color: inherit; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
  .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 0.375em 0.75em; text-align: left; }
  .markdown-body th { background: #f9fafb; font-weight: 600; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 600; margin: 0.5em 0 0.25em; }
  .markdown-body h1 { font-size: 1.25em; }
  .markdown-body h2 { font-size: 1.125em; }
  .markdown-body h3 { font-size: 1em; }
  .markdown-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.75em 0; }
  .markdown-body a { color: #3b82f6; text-decoration: underline; }
  </style>
