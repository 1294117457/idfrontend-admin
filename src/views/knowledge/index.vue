<template>
  <div class="p-6">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold">AI 知识库管理</span>
          <el-button type="primary" @click="knowledgeFileInput?.click()" :loading="uploading">
            上传文件
          </el-button>
          <input
            ref="knowledgeFileInput"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.md,.txt"
            class="hidden"
            @change="handleUpload"
          />
        </div>
      </template>

      <el-alert type="info" :closable="false" class="mb-4">
        <template #title>支持 PDF、Word、Excel、Markdown、TXT 格式，最大 20MB。上传后 AI 将自动学习内容用于问答。</template>
      </el-alert>

      <!-- 文件列表 -->
      <el-table :data="fileList" v-loading="loading" border stripe>
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

      <div v-if="!loading && fileList.length === 0" class="text-center py-8 text-gray-400">
        暂无知识库文件，请上传文件以启用 AI 知识库问答
      </div>

      <!-- AI 服务不可用提示 -->
      <el-alert
        v-if="agentUnavailable"
        type="warning"
        title="AI Agent 服务当前不可用，知识库功能暂时无法使用"
        :closable="false"
        class="mt-4"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listKnowledge, uploadKnowledge, deleteKnowledge, type KnowledgeFile } from '@/api/components/apiAIagent'

const loading = ref(false)
const uploading = ref(false)
const deletingFile = ref<string | null>(null)
const fileList = ref<KnowledgeFile[]>([])
const agentUnavailable = ref(false)
const knowledgeFileInput = ref<HTMLInputElement | null>(null)

const loadFiles = async () => {
  loading.value = true
  agentUnavailable.value = false
  try {
    const res = await listKnowledge()
    if (res.code === 200) {
      fileList.value = res.data || []
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
  try {
    const res = await uploadKnowledge(file)
    if (res.code === 200) {
      ElMessage.success(`${file.name} 上传成功`)
      await loadFiles()
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch {
    ElMessage.error('上传失败，请检查 AI Agent 是否运行')
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
      fileList.value = fileList.value.filter(f => f.sourceFile !== sourceFile)
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
  loadFiles()
})
</script>
