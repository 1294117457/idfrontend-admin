<script setup lang="ts">
import UI1 from './component/ui1.vue'
import TITLEUI from '../home/component/titleUI.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
// ✅ 修改导入: 使用 adminLoginPost
import { type LoginDto, adminLoginPost, type CaptchaResponse, getCaptcha } from '@/api/components/apiLogin'
import { useUserStore } from '@/stores/profile'

const userStore = useUserStore()
const router = useRouter()
const captchaUrl = ref('')
const captchaData = ref<CaptchaResponse | null>(null)

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
const validate = (): boolean => {  // ✅ 返回boolean
  if (!loginBody.value.username) {
    ElMessage.error('请输入用户名')
    return false  // ✅ 返回false
  }
  if (!loginBody.value.password) {
    ElMessage.error('请输入密码')
    return false  // ✅ 返回false
  }
  if (!loginBody.value.verifyCode) {
    ElMessage.error('请输入验证码')
    return false  // ✅ 返回false
  }
  return true  // ✅ 验证通过返回true
}
// ✅ 修改: 调用管理员登录接口
const submitLogin = async () => {
  if (!validate()) return;
  try {
    // ✅ 使用管理员登录接口
    const response = await adminLoginPost(loginBody.value);
    console.log('登录响应', response);
    if (response.code === 200) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      ElMessage.success('登录成功');
      router.push('/home')
      const success = await userStore.fetchUserData()
      if (!success) {
        ElMessage.error('获取用户信息失败，请稍后重试')
      }
    } else {
      ElMessage.error(response.msg || '登录失败');
    }
  } catch (error) {
    console.error('登录失败', error);
    ElMessage.error('网络错误,请稍后重试');
  } finally{
    refreshCaptcha();
  }
}

const activeTab = ref<'account' | 'qrcode'>('account')

function switchTab(tab: 'account' | 'qrcode') {
  activeTab.value = tab
}

const handleRegister = () => {
  router.push('/register')
}

const forgotPassword = () => {
  router.push('/forgot')
}

onMounted(() => {
  refreshCaptcha();
})
</script>

<template>
  <div class="fixed inset-0 bg-white w-full h-full overflow-hidden select-none">
    <!-- 背景图 -->
    <img src="@/assets/images/bg.png" class="fixed top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[30vw]  object-contain z-0" alt="背景" />
    <!-- 标题 -->
    <TITLEUI/>
    <UI1 />

    <div class="fixed top-0 bottom-0 right-[12vw] flex flex-col mt-5 z-50 ">
      <div class="font-['Microsoft_YaHei','微软雅黑',Arial,sans-serif] pl-2 mb-4 text-center tracking-[0.2em] text-[2.4rem] font-bold text-gray-800 w-[450px] max-w-[90vw] leading-snug mx-auto">
        推免材料处理平台
      </div>
      <div class="relative bg-[rgba(80,70,70,0.7)] rounded-xl p-[2em] shadow-lg text-white w-[450px] max-w-[90vw] mx-auto">
        <div class="flex items-center justify-center mb-4">
          <h4 class="font-bold text-[24px] text-white m-0 ">统一身份认证</h4>
        </div>
        <div class="flex justify-center gap-4 mb-5">
          <button
          :class="[
            'px-5 py-3 font-bold text-lg bg-transparent outline-none transition duration-200 rounded-none cursor-pointer',
            activeTab === 'qrcode'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-300 border-b-2 border-transparent'
          ]"
          @click="switchTab('qrcode')"
        >扫码登录</button>
        <button
          :class="[
            'px-5 py-3 font-bold text-lg bg-transparent outline-none transition duration-200 rounded-none cursor-pointer',
            activeTab === 'account'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-300 border-b-2 border-transparent'
          ]"
          @click="switchTab('account')"
        >账号登录</button>
</div>
        <div class=" transition-all">
          <!-- 二维码登录 -->
          <div v-if="activeTab === 'qrcode'" class="flex flex-col items-center justify-center">
            <div class="p-3 rounded mb-3 bg-white">
              <div class="w-52 h-52 flex items-center justify-center">
                <!-- 二维码图片或面板 -->
                <img src="@/assets/images/qrcode.png" alt="企业微信二维码" class="w-full h-full object-contain" />
              </div>
            </div>
            <p class="text-white mb-4 font-bold">微信扫码加好友</p>
          </div>
          <!-- 账号登录 -->
          <div v-if="activeTab === 'account'">
            <el-form class="mt-3 space-y-4" @submit.prevent="submitLogin" :model=loginBody>
            <el-form-item >
              <input v-model="loginBody.username" type="text" placeholder="请输入用户名" autofocus class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none"/>
            </el-form-item>
            <el-form-item>
              <input v-model="loginBody.password" type="password" placeholder="请输入密码" class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none" autocomplete="current-password"/>
            </el-form-item>
            <el-form-item>
              <div class="flex items-center gap-3 w-full">
                <input v-model="loginBody.verifyCode" type="text" placeholder="请输入验证码" class="w-full h-12 px-4 rounded-lg bg-white text-black border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition outline-none"/>
                <img :src="captchaUrl" alt="验证码" class="w-full h-12 object-cover rounded cursor-pointer" @click="refreshCaptcha" title="点击刷新验证码" />
              </div>
            </el-form-item>
            <el-form-item>
              <button type="submit" class="h-12 w-full flex flex-row items-center justify-center bg-blue-700 font-[700] text-[20px] py-3text-xl tracking-[0.1em] text-white rounded-lg transition cursor-pointer  hover:bg-[#4672F4] active:scale-95" native-type="submit">登 录</button>
            </el-form-item>
            <div class="flex justify-between mt-7 text-gray-300 text-base font-bold">
              <span class="cursor-pointer" @click="handleRegister()">注册账号</span>
              <span class="cursor-pointer" @click="forgotPassword">忘记密码</span>
            </div>
          </el-form>
          </div>
        </div>
        <div class="text-center mt-4 text-sm text-white/60 font-normal">
          版本号：<span>1.0.0</span>
        </div>
      </div>
    </div>
  </div>
</template>
