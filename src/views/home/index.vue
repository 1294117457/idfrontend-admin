<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 定义组件名称
defineOptions({
  name: 'Welcome',
})

// 获取路由实例和当前路由
const router = useRouter()
const route = useRoute()

// 定义激活路径
const activePath = ref(route.path)

// 获取所有模块的路由配置
const homeRoute = computed(() => {
  return router.options.routes.find((route) => route.path === '/home')
})

// 获取所有模块（排除重定向路由、不显示的路由和首页相关路由）
const modules = computed(() => {
  if (!homeRoute.value || !homeRoute.value.children) return []

  // 过滤掉重定向路由、隐藏路由和首页相关路由，并按sort排序
  return [...homeRoute.value.children]
    .filter(
      (route) =>
        !route.redirect &&
        !route.meta?.hidden &&
        route.path !== 'home' &&
        route.meta?.title !== '首页',
    )
    .sort((a, b) => Number(a.meta?.sort ?? Infinity) - Number(b.meta?.sort ?? Infinity))
})

// 导航到指定路径
const navigateTo = (module: any) => {
  let targetPath = '/home/' + module.path

  // 如果有子路由，导航到第一个子路由
  if (module.children && module.children.length > 0) {
    // 按sort排序子路由
    const sortedChildren = [...module.children]
      .filter((route) => !route.redirect && !route.meta?.hidden)
      .sort((a, b) => (a.meta?.sort ?? Infinity) - (b.meta?.sort ?? Infinity))

    if (sortedChildren.length > 0) {
      targetPath = `/home/${module.path}/${sortedChildren[0].path}`
    }
  }

  router.push(targetPath)
  activePath.value = targetPath.replace('/home/', '')
}

// 获取图标颜色
const getIconColor = (index: number) => {
  const colors = [
    'text-blue-500',
    'text-green-500',
    'text-purple-500',
    'text-orange-500',
    'text-red-500',
    'text-cyan-500',
    'text-amber-500',
    'text-indigo-500',
  ]
  return colors[index % colors.length]
}

// 当前时间
const currentTime = ref('')
const currentDate = ref('')
let timer: ReturnType<typeof setInterval> | undefined

// 更新时间的函数
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

watch(
  () => route.path,
  (newPath) => {
    activePath.value = newPath.replace('/home/', '')
  },
  { immediate: true },
)

// 组件挂载时开始更新时间
onMounted(() => {
  updateTime()
  // 每秒更新时间
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="admin-home">
    <section class="hero-card">
      <div>
        <p class="eyebrow">后台管理平台</p>
        <h1>欢迎来到平台管理</h1>
        <p class="hero-desc">集中管理保研助手平台的模板、学生、审核、文件与 AI 能力，保持流程清晰高效。</p>
      </div>
      <div class="time-card">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
    </section>

    <section class="module-section">
      <div class="section-title">
        <h2>功能模块</h2>
        <span>点击卡片进入对应管理模块</span>
      </div>

      <div class="module-grid">
        <button
          v-for="(module, index) in modules"
          :key="module.path"
          class="module-card"
          @click="navigateTo(module)"
        >
          <span class="module-icon" :class="getIconColor(index)">
            <component v-if="module.meta?.icon" :is="module.meta.icon" class="w-7 h-7" />
            <span v-else class="text-lg">●</span>
          </span>
          <span class="module-title">{{ module.meta?.title || module.path }}</span>
          <span class="module-enter">进入管理 →</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-home {
  min-height: calc(100dvh - 3rem);
  padding: clamp(1rem, 2.5vw, 2rem);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1.25rem;
  max-width: 1180px;
  margin: 0 auto 1.5rem;
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  margin-bottom: 0.5rem;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-card h1 {
  color: #0f172a;
  font-size: clamp(1.85rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
}

.hero-desc {
  max-width: 620px;
  margin-top: 0.75rem;
  color: #64748b;
  line-height: 1.8;
}

.time-card {
  min-width: 230px;
  padding: 1.25rem;
  border: 1px solid #dbeafe;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  text-align: center;
}

.time {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 800;
}

.date {
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
}

.module-section {
  max-width: 1180px;
  margin: 0 auto;
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title h2 {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 800;
}

.section-title span {
  color: #64748b;
  font-size: 0.9rem;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
}

.module-card {
  display: grid;
  gap: 0.75rem;
  min-height: 150px;
  padding: 1.1rem;
  text-align: left;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.module-card:hover {
  transform: translateY(-2px);
  border-color: #bfdbfe;
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.12);
}

.module-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 14px;
  background: #eff6ff;
}

.module-title {
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.module-enter {
  align-self: end;
  color: #2563eb;
  font-size: 0.86rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .admin-home {
    padding: 0.85rem;
  }

  .hero-card {
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .time-card {
    min-width: 0;
  }

  .section-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>