import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getUserBasicInfo, getUserCompleteInfo, getMyRoles, type UserInfoVO } from '@/api/modules/apiUser'
import { STORAGE_KEYS } from '@common/constants/storage'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfoVO | null>(null)
  const userRoles = ref<string[]>([])

  const isLoggedIn = computed(() => !!userInfo.value)

  const hasToken = computed(() => !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))

  const hasStudentInfo = computed(() => !!userInfo.value?.fullName)

  const fetchUserData = async (): Promise<boolean> => {
    try {
      const [completeRes, basicRes] = await Promise.all([
        getUserCompleteInfo(),
        getUserBasicInfo(),
      ])
      userInfo.value = {
        ...completeRes.data,
        avatar: basicRes.data.avatar || completeRes.data.avatar,
        phone: completeRes.data.phone || basicRes.data.phone,
      }
      return true
    } catch {
      return false
    }
  }

  const fetchUserRoles = async (): Promise<void> => {
    try {
      const res = await getMyRoles()
      userRoles.value = res.data.map((r: any) => r.roleCode)
    } catch {
      // interceptor shows error
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
