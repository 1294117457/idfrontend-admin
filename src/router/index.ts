import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/profile'
import { STORAGE_KEYS } from '@common/constants/storage'
import homeRoutes from './home'
import loginRoutes from './login'

const routes = [
  ...loginRoutes,
  homeRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const PUBLIC_ROUTES = ['/login', '/register', '/forgot', '/']

router.beforeEach(async (to) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const isPublicRoute = PUBLIC_ROUTES.includes(to.path)

  if (isPublicRoute) {
    if (token && to.path === '/login') {
      return '/home/index'
    }
    return true
  }

  if (!token) {
    return '/login'
  }

  const userStore = useUserStore()

  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserData()
    } catch {
      userStore.clearAll()
      return '/login'
    }
  }

  if (userStore.userRoles.length === 0) {
    await userStore.fetchUserRoles()
  }

  const requiredRoles = to.matched.flatMap(r => (r.meta?.requiresRoles as string[]) || [])
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(r => userStore.userRoles.includes(r))
    if (!hasRole) {
      return '/home/index'
    }
  }

  return true
})

export default router
