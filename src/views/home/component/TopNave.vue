<template>
  <div class="fixed top-0 left-0 right-0 h-12 bg-white shadow-md flex items-center px-4 md:px-6 z-50">
    <h1 class="text-lg md:text-2xl font-bold pl-20 md:pl-28 dark:text-white truncate">保研加分材料系统</h1>
    <div class="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
      <el-dropdown @command="handleCommand" class="cursor-pointer">
        <div class="flex items-center text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-300 transition outline-none gap-1">
          <img src="@/assets/images/avatar.png" alt="头像" class="w-7 md:w-8 rounded-full" />
          <span class="text-sm md:text-lg max-w-32 md:max-w-48 truncate">{{ userStore.userInfo?.fullName || userStore.userInfo?.username || '' }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="select-none">
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              修改账户信息
            </el-dropdown-item>
            <el-dropdown-item command="logout">
              <el-icon><Logout /></el-icon>
              注销
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router'
import { useUserStore } from '@/stores/profile'
import { STORAGE_KEYS } from '@common/constants/storage'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/home/profile')
  } else if (command === 'logout') {
    logout()
  }
}

const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.THEME)
  ElMessage.success('已注销')
  router.push('/login')
}
</script>
