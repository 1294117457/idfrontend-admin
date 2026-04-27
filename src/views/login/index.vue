<script setup lang="ts">
import UI1 from './component/ui1.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { type LoginDto, adminLoginPost, type CaptchaResponse, getCaptcha } from '@/api/modules/apiLogin'
import { useUserStore } from '@/stores/profile'
import { STORAGE_KEYS } from '@common/constants/storage'

const userStore = useUserStore()
const router = useRouter()
const captchaUrl = ref('')
const captchaData = ref<CaptchaResponse | null>(null)
const isLoggingIn = ref(false)

const refreshCaptcha = async () => {
  try {
    captchaData.value = await getCaptcha()
    loginBody.value.captchaId = captchaData.value.captchaId
    captchaUrl.value = captchaData.value.base64
  } catch (error) {
    console.error('获取验证码失败:', error)
    ElMessage.error('获取验证码失败，请重试')
  }
}

const loginBody = ref<LoginDto>({
  username: '',
  password: '',
  verifyCode: '',
  captchaId: '',
})

const validate = (): boolean => {
  if (!loginBody.value.username) {
    ElMessage.error('请输入用户名')
    return false
  }
  if (!loginBody.value.password) {
    ElMessage.error('请输入密码')
    return false
  }
  if (!loginBody.value.verifyCode) {
    ElMessage.error('请输入验证码')
    return false
  }
  return true
}

const submitLogin = async () => {
  if (isLoggingIn.value) return
  if (!validate()) return
  isLoggingIn.value = true
  try {
    const res = await adminLoginPost(loginBody.value)
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.data.refreshToken)
    const success = await userStore.fetchUserData()
    await router.push('/home')
    if (!success) {
      ElMessage.warning('获取用户信息失败，请检查权限')
    }
  } catch {
    // interceptor already showed error toast
  } finally {
    isLoggingIn.value = false
    refreshCaptcha()
  }
}

const handleRegister = () => {
  router.push('/register')
}

const forgotPassword = () => {
  router.push('/forgot')
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<template>
  <div class="fixed inset-0 bg-white w-full h-full overflow-hidden select-none">
    <img src="@/assets/images/bg.png" class="fixed top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[30vw] object-contain z-0" alt="" />
    <UI1 />

    <div class="fixed top-0 bottom-0 right-[12vw] flex flex-col mt-5 z-50">
      <div class="font-['Microsoft_YaHei',Arial,sans-serif] pl-2 mb-4 text-center tracking-[0.2em] text-[2.4rem] font-bold text-gray-800 w-[450px] max-w-[90vw] leading-snug mx-auto">
        推免材料处理平台
      </div>
      <div class="relative bg-[rgba(80,70,70,0.7)] rounded-xl p-[2em] shadow-lg text-white w-[450px] max-w-[90vw] mx-auto">
        <div class="flex items-center justify-center mb-4">
          <h4 class="font-bold text-[24px] text-white m-0">管理员登录</h4>
        </div>
        <el-form class="mt-3 space-y-4" @submit.prevent="submitLogin" :model="loginBody">
          <el-form-item>
            <input v-model="loginBody.username" type="text" placeholder="请输入用户名" autofocus class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none" />
          </el-form-item>
          <el-form-item>
            <input v-model="loginBody.password" type="password" placeholder="请输入密码" class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none" autocomplete="current-password" />
          </el-form-item>
          <el-form-item>
            <div class="flex items-center gap-3 w-full">
              <input v-model="loginBody.verifyCode" type="text" placeholder="请输入验证码" class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none" />
              <img :src="captchaUrl" alt="验证码" class="w-full h-12 object-cover rounded cursor-pointer" @click="refreshCaptcha" title="点击刷新验证码" />
            </div>
          </el-form-item>
          <el-form-item>
            <button type="submit" :disabled="isLoggingIn" class="h-12 w-full flex items-center justify-center bg-blue-700 font-bold text-xl tracking-[0.1em] text-white rounded-lg transition cursor-pointer hover:bg-[#4672F4] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed" native-type="submit">
              {{ isLoggingIn ? '登录中...' : '登 录' }}
            </button>
          </el-form-item>
          <div class="flex justify-between mt-7 text-gray-300 text-base font-bold">
            <span class="cursor-pointer" @click="handleRegister()">注册账号</span>
            <span class="cursor-pointer" @click="forgotPassword">忘记密码</span>
          </div>
        </el-form>
        <div class="text-center mt-4 text-sm text-white/60 font-normal">
          版本号 <span>1.0.0</span>
        </div>
      </div>
    </div>
  </div>
</template>
