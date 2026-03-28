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

// ✅ 全局前置守卫 - 未登录跳转到登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  if (!token && !PUBLIC_ROUTES.includes(to.path)) {
    next('/login')
  } else {
    next()
  }
})

export default router