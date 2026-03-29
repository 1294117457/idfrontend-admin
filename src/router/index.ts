import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/profile'  // ✅ 导入 useUserStore
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

// ✅ 全局前置守卫 - 未登录跳转登录页，有角色限制的路由检查角色
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('accessToken')
  if (!token && !PUBLIC_ROUTES.includes(to.path)) {
    return next('/login')
  }

  // 检查当前路由链上是否有 requiresRoles
  const requiredRoles = to.matched.flatMap(r => (r.meta?.requiresRoles as string[]) || [])
  if (requiredRoles.length > 0 && token) {
    const userStore = useUserStore()
    if (userStore.userRoles.length === 0) {
      await userStore.fetchUserRoles()
    }
    const hasRole = requiredRoles.some(r => userStore.userRoles.includes(r))
    if (!hasRole) {
      return next('/home/index')
    }
  }

  next()
})

export default router