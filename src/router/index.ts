import { createRouter, createWebHistory } from 'vue-router'
import homeRoutes from './home'
import loginRoutes from './login'

const routes = [
  ...loginRoutes,// 等价于把 loginRoutes 的每个对象都放进 routes
  homeRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),//来自vite.config.ts
  routes,
})

export default router