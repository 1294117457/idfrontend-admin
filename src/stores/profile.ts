import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getUserCompleteInfo, getUserRoles, type UserInfoVO } from '@/api/components/apiUser' // ✅ 修改导入

export const useUserStore = defineStore('user', () => {
  // ✅ 使用新的类型
  const userInfo = ref<UserInfoVO | null>(null)
  const userRoles = ref<string[]>([])

  // 登录状态
  const isLoggedIn = computed(() => !!userInfo.value)

  // Token 状态
  const hasToken = computed(() => !!localStorage.getItem('accessToken'))

  // 是否已绑定学生信息
  const hasStudentInfo = computed(() => !!userInfo.value?.fullName)

  /**
   * ✅ 使用新接口获取用户完整信息
   */
  const fetchUserData = async (): Promise<boolean> => {
    try {
      const response = await getUserCompleteInfo() // ✅ 使用新接口
      if (response.code === 200) {
        userInfo.value = response.data
        console.log('✅ 用户信息获取成功:', response.data)
        return true
      } else {
        throw new Error(response.msg || '获取用户信息失败')
      }
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      return false
    }
  }

  /**
   * ✅ 获取用户角色列表（用于菜单权限过滤）
   */
  const fetchUserRoles = async (userId: number): Promise<void> => {
    try {
      const res = await getUserRoles(userId)
      if (res.code === 200) {
        userRoles.value = res.data.map((r: any) => r.roleCode)
      }
    } catch (error) {
      console.error('❌ 获取用户角色失败:', error)
    }
  }

  /**
   * ✅ 更新用户信息 (局部更新)
   */
  const updateUserInfo = (partialInfo: Partial<UserInfoVO>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partialInfo }
    }
  }

  /**
   * ✅ 清除所有用户数据 (登出)
   */
  const clearAll = () => {
    userInfo.value = null
    userRoles.value = []
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    // 状态
    userInfo,
    userRoles,
    isLoggedIn,
    hasToken,
    hasStudentInfo,

    // 方法
    fetchUserData,
    fetchUserRoles,
    updateUserInfo,
    clearAll
  }
})