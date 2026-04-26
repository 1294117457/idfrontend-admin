<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <el-card>
      <template #header><span class="font-bold">系统设置</span></template>
      <el-form label-width="180px">
        <el-form-item label="学生前台登录">
          <div class="flex items-center gap-4">
            <el-switch
              v-model="frontendLoginEnabled"
              :loading="switchLoading"
              active-text="开放登录"
              inactive-text="禁止登录"
              active-color="#67c23a"
              inactive-color="#f56c6c"
              @change="handleFrontendLoginToggle"
            />
            <el-tag :type="frontendLoginEnabled ? 'success' : 'danger'" size="small">
              {{ frontendLoginEnabled ? '当前：学生可正常登录' : '当前：学生前台已关闭' }}
            </el-tag>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            关闭后，学生将无法登录前台系统（已登录的用户不受影响）；管理员后台登录不受此开关影响。
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSystemConfig, setSystemConfig } from '@/api/modules/apiSystem'

const frontendLoginEnabled = ref(true)
const switchLoading = ref(false)

const loadConfig = async () => {
  try {
    const res = await getSystemConfig('frontend_login_enabled')
    if (res.code === 200) {
      frontendLoginEnabled.value = res.data !== 'false'
    }
  } catch (error) {
    console.error('加载系统配置失败:', error)
  }
}

const handleFrontendLoginToggle = async (val: boolean) => {
  switchLoading.value = true
  try {
    const res = await setSystemConfig('frontend_login_enabled', val ? 'true' : 'false')
    if (res.code === 200) {
      ElMessage.success(val ? '前台登录已开放' : '前台登录已关闭')
    } else {
      frontendLoginEnabled.value = !val
      ElMessage.error(res.msg || '设置失败')
    }
  } catch (error: any) {
    frontendLoginEnabled.value = !val
    ElMessage.error(error.response?.data?.msg || '设置失败')
  } finally {
    switchLoading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.text-xs { font-size: 0.75rem; }
.text-gray-400 { color: #9ca3af; }
.mt-1 { margin-top: 0.25rem; }
</style>
