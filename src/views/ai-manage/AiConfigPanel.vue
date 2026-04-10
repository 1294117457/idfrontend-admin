<template>
  <div>
    <el-alert
      v-if="agentUnavailable"
      type="warning"
      title="AI Agent 服务当前不可用，配置无法读取或保存"
      :closable="false"
      class="mb-4"
    />

    <el-alert type="info" :closable="false" class="mb-6">
      <template #title>修改配置后立即对所有新对话生效，无需重启 Agent。</template>
    </el-alert>

    <el-form
      ref="formRef"
      :model="form"
      label-width="120px"
      :disabled="agentUnavailable || loading"
      style="max-width: 720px"
    >
      <el-form-item label="系统提示词">
        <el-input
          v-model="form.systemRole"
          type="textarea"
          :rows="4"
          placeholder="AI 助手的角色设定，修改后立即对新对话生效"
        />
      </el-form-item>

      <el-form-item label="对话模型">
        <el-input v-model="form.chatModel" placeholder="如 qwen3-max" />
      </el-form-item>

      <el-form-item label="向量模型">
        <el-input
          v-model="form.embeddingModel"
          placeholder="如 text-embedding-v3"
          @change="onEmbeddingModelChange"
        />
        <div class="text-xs text-orange-500 mt-1">
          修改向量模型后，现有知识库需重新上传以重建向量索引。
        </div>
      </el-form-item>

      <el-form-item label="API Base URL">
        <el-input v-model="form.baseUrl" placeholder="如 https://dashscope.aliyuncs.com/compatible-mode/v1" />
      </el-form-item>

      <el-form-item label="API Key">
        <div class="flex gap-2 w-full">
          <el-input
            v-if="editingApiKey"
            v-model="form.apiKey"
            type="password"
            show-password
            placeholder="输入新 API Key"
            class="flex-1"
          />
          <el-input
            v-else
            :value="maskedApiKey"
            readonly
            class="flex-1"
          />
          <el-button @click="toggleApiKeyEdit">
            {{ editingApiKey ? '取消' : '修改' }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="agentUnavailable"
          @click="handleSave"
        >
          保存配置
        </el-button>
        <el-button @click="handleReset" :disabled="agentUnavailable || loading">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAIConfig, updateAIConfig, type AIConfig } from '@/api/components/apiAIagent'

const loading = ref(false)
const saving = ref(false)
const agentUnavailable = ref(false)
const editingApiKey = ref(false)
const maskedApiKey = ref('')

const form = ref<AIConfig>({
  systemRole: '',
  apiKey: '',
  baseUrl: '',
  chatModel: '',
  embeddingModel: '',
})

const originalEmbeddingModel = ref('')

const loadConfig = async () => {
  loading.value = true
  agentUnavailable.value = false
  try {
    const res = await getAIConfig()
    if (res.code === 200 && res.data) {
      const d = res.data
      form.value.systemRole = d.systemRole
      form.value.chatModel = d.chatModel
      form.value.embeddingModel = d.embeddingModel
      form.value.baseUrl = d.baseUrl
      maskedApiKey.value = d.apiKey
      originalEmbeddingModel.value = d.embeddingModel
    } else {
      agentUnavailable.value = true
    }
  } catch {
    agentUnavailable.value = true
  } finally {
    loading.value = false
  }
}

const toggleApiKeyEdit = () => {
  editingApiKey.value = !editingApiKey.value
  if (!editingApiKey.value) {
    form.value.apiKey = ''
  }
}

const onEmbeddingModelChange = async (newVal: string) => {
  if (newVal !== originalEmbeddingModel.value && originalEmbeddingModel.value) {
    await ElMessageBox.alert(
      '向量模型已更改。保存后，现有知识库的向量索引将失效，需要重新上传所有知识库文件以重建索引。',
      '注意',
      { type: 'warning', confirmButtonText: '我已了解' }
    )
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const update: Record<string, string> = {
      systemRole: form.value.systemRole,
      chatModel: form.value.chatModel,
      embeddingModel: form.value.embeddingModel,
      baseUrl: form.value.baseUrl,
    }
    if (editingApiKey.value && form.value.apiKey) {
      update.apiKey = form.value.apiKey
    }

    const res = await updateAIConfig(update)
    if (res.code === 200) {
      ElMessage.success('配置已保存，立即生效')
      editingApiKey.value = false
      form.value.apiKey = ''
      await loadConfig()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败，请检查 AI Agent 是否运行')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  loadConfig()
}

onMounted(() => {
  loadConfig()
})
</script>
