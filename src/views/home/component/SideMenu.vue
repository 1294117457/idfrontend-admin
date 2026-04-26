<template>
  <el-menu
    :default-active="activePath"
    :collapse="isCollapse"
    class="side-menu"
    @open="handleOpen"
    @close="handleClose"
  >
    <template v-for="item in sortedMenuRoutes" :key="item.path">
      <el-sub-menu
        v-if="item.children && item.children.length"
        :index="item.path"
        class="bg-gradient-to-r from-blue-50 to-blue-10"
      >
        <template #title>
          <component v-if="item.meta?.icon" :is="item.meta.icon" class="w-5 h-5 md:w-6 md:h-6" />
          <span>{{ item.meta?.title || item.path }}</span>
        </template>
        <el-menu-item
          v-for="sub in item.children"
          :key="sub.path"
          :index="item.path + '/' + sub.path"
          @click="navigateTo('/home/' + item.path + '/' + sub.path)"
        >
          {{ sub.meta?.title || sub.path }}
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item
        v-else
        :index="item.path"
        @click="navigateTo('/home/' + item.path)"
        class="bg-gradient-to-r from-blue-50 to-blue-10"
      >
        <component v-if="item.meta?.icon" :is="item.meta.icon" class="w-5 h-5 md:w-6 md:h-6" />
        <span>{{ item.meta?.title || item.path }}</span>
      </el-menu-item>
    </template>

    <div
      class="absolute top-1/2 -right-1 transform -translate-y-1/2 cursor-pointer p-2 bg-white shadow rounded-l-lg"
      @click="isCollapse = !isCollapse"
    >
      {{ isCollapse ? '→' : '←' }}
    </div>
  </el-menu>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/profile'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isCollapse = ref(false)
const activePath = ref(route.path)

const COLLAPSE_BREAKPOINT = 1024

const checkCollapse = () => {
  if (window.innerWidth < COLLAPSE_BREAKPOINT) {
    isCollapse.value = true
  }
}

onMounted(async () => {
  checkCollapse()
  window.addEventListener('resize', checkCollapse)
  if (userStore.userRoles.length === 0) {
    await userStore.fetchUserRoles()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkCollapse)
})

const homeRoute = router.options.routes.find((r) => r.path === '/home')
const menuRoutes = homeRoute?.children?.filter((r) => !r.redirect && !r.meta?.hidden) || []

const sortedMenuRoutes = computed(() => {
  return [...menuRoutes]
    .filter((route) => {
      const required = route.meta?.requiresRoles as string[] | undefined
      if (!required || required.length === 0) return true
      return required.some((r) => userStore.userRoles.includes(r))
    })
    .sort((a, b) => (a.meta?.sort ?? Infinity) - (b.meta?.sort ?? Infinity))
})

watch(
  () => route.path,
  (newPath) => {
    activePath.value = newPath.replace('/home/', '')
  },
  { immediate: true },
)

const navigateTo = (path: string) => {
  router.push(path)
  activePath.value = path.replace('/home/', '')
}
const handleOpen = (key: string, keyPath: string[]) => {}
const handleClose = (key: string, keyPath: string[]) => {}
</script>

<style scoped>
.side-menu {
  position: relative;
  top: 3rem;
  height: calc(100vh - 3rem);
  height: calc(100dvh - 3rem);
  overflow-y: auto;
  flex-shrink: 0;
  transition: width 0.3s ease;
}
</style>
