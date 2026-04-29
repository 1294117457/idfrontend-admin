<template>
  <div>
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <el-card shadow="never" class="text-center">
        <el-statistic title="知识库文件数" :value="stats.totalFiles" />
      </el-card>
      <el-card shadow="never" class="text-center">
        <el-statistic title="向量分块总数" :value="stats.totalChunks" />
      </el-card>
      <el-card shadow="never" class="text-center">
        <div class="el-statistic">
          <div class="el-statistic__head">Agent 状态</div>
          <div class="el-statistic__content mt-1">
            <span :class="agentUnavailable ? 'text-red-500' : 'text-green-500'" class="text-lg font-semibold">
              {{ agentUnavailable ? '● 离线' : '● 在线' }}
            </span>
          </div>
        </div>
      </el-card>
    </div>

    <el-alert type="info" :closable="false" class="mb-4">
      <template #title>支持 PDF、Word、Excel、Markdown、TXT 格式，最大 20MB。上传后 AI 将自动学习内容用于问答。</template>
    </el-alert>

    <!-- 操作栏 -->
    <div class="flex justify-start sm:justify-end mb-4">
      <el-button type="primary" @click="knowledgeFileInput?.click()" :loading="uploading">
        {{ uploading ? '解析入库中...' : '上传文件' }}
      </el-button>
      <input
        ref="knowledgeFileInput"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.md,.txt"
        class="hidden"
        @change="handleUpload"
      />
    </div>

    <!-- 文件列表 -->
    <el-table :data="stats.files" v-loading="loading" border stripe class="responsive-table">
      <el-table-column prop="sourceFile" label="文件名" min-width="300" />
      <el-table-column prop="chunkCount" label="知识块数" width="120" align="center" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-popconfirm
            title="确认删除该知识库文件？删除后 AI 将不再参考此文件。"
            @confirm="handleDelete(row.sourceFile)"
          >
            <template #reference>
              <el-button type="danger" size="small" :loading="deletingFile === row.sourceFile">
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && stats.files.length === 0" class="text-center py-8 text-gray-400">
      暂无知识库文件，请上传文件以启用 AI 知识库问答
    </div>

    <!-- 上传反馈 -->
    <div v-if="uploadResult" class="mt-4">
      <el-alert
        :type="uploadResult.success ? 'success' : 'error'"
        :title="uploadResult.message"
        :closable="true"
        show-icon
        @close="uploadResult = null"
      />
    </div>

    <!-- Agent 不可用提示 -->
    <el-alert
      v-if="agentUnavailable"
      type="warning"
      title="AI Agent 服务当前不可用，知识库功能暂时无法使用"
      :closable="false"
      class="mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getKnowledgeStats,
  uploadKnowledge,
  deleteKnowledge,
  type KnowledgeFile,
} from '@/api/modules/apiAIagent'

const loading = ref(false)
const uploading = ref(false)
const deletingFile = ref<string | null>(null)
const agentUnavailable = ref(false)
const knowledgeFileInput = ref<HTMLInputElement | null>(null)

const stats = reactive<{ totalFiles: number; totalChunks: number; files: KnowledgeFile[] }>({
  totalFiles: 0,
  totalChunks: 0,
  files: [],
})

const uploadResult = ref<{ success: boolean; message: string } | null>(null)

const loadStats = async () => {
  loading.value = true
  agentUnavailable.value = false
  try {
    const res = await getKnowledgeStats()
    if (res.code === 200 && res.data) {
      stats.totalFiles = res.data.totalFiles
      stats.totalChunks = res.data.totalChunks
      stats.files = res.data.files || []
    } else {
      agentUnavailable.value = true
    }
  } catch {
    agentUnavailable.value = true
  } finally {
    loading.value = false
  }
}

const handleUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  input.value = ''

  uploading.value = true
  uploadResult.value = null
  try {
    const res = await uploadKnowledge(file)
    if (res.code === 200 && res.data) {
      const d = res.data
      uploadResult.value = {
        success: true,
        message: `${d.fileName} 上传成功，解析 ${d.textLength ?? '?'} 字 → ${d.chunkCount} 个向量分块`,
      }
      ElMessage.success(uploadResult.value.message)
      await loadStats()
    } else {
      uploadResult.value = { success: false, message: res.msg || '上传失败' }
      ElMessage.error(uploadResult.value.message)
    }
  } catch {
    uploadResult.value = { success: false, message: '上传失败，请检查 AI Agent 是否运行' }
    ElMessage.error(uploadResult.value.message)
  } finally {
    uploading.value = false
  }
}

const handleDelete = async (sourceFile: string) => {
  deletingFile.value = sourceFile
  try {
    const res = await deleteKnowledge(sourceFile)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadStats()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败')
  } finally {
    deletingFile.value = null
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.responsive-table {
  width: 100%;
}

@media (max-width: 768px) {
  :deep(.el-table__inner-wrapper) {
    overflow-x: auto;
  }
}
</style>
