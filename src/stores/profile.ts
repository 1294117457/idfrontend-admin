import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getUserCompleteInfo, getMyRoles, type UserInfoVO } from '@/api/modules/apiUser'
import { STORAGE_KEYS } from '@common/constants/storage'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfoVO | null>(null)
  const userRoles = ref<string[]>([])

  const isLoggedIn = computed(() => !!userInfo.value)

  const hasToken = computed(() => !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))

  const hasStudentInfo = computed(() => !!userInfo.value?.fullName)

  const fetchUserData = async (): Promise<boolean> => {
    try {
      const response = await getUserCompleteInfo()
      if (response.code === 200) {
        userInfo.value = response.data
        return true
      } else {
        throw new Error(response.msg || '????????')
      }
    } catch (error) {
      console.error('????????:', error)
      return false
    }
  }

  const fetchUserRoles = async (): Promise<void> => {
    try {
      const res = await getMyRoles()
      if (res.code === 200) {
        userRoles.value = res.data.map((r: any) => r.roleCode)
      }
    } catch (error) {
      console.error('????????:', error)
    }
  }

  const updateUserInfo = (partialInfo: Partial<UserInfoVO>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partialInfo }
    }
  }

  const clearAll = () => {
    userInfo.value = null
    userRoles.value = []
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  return {
    userInfo,
    userRoles,
    isLoggedIn,
    hasToken,
    hasStudentInfo,

    fetchUserData,
    fetchUserRoles,
    updateUserInfo,
    clearAll
  }
})
