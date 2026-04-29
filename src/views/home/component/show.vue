<template>
  <div class="admin-layout">
    <TITLEUI />
    <SIDEMENT />
    <TOPNAVE />

    <main class="admin-main">
      <router-view />
      <AiAssistant />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import TITLEUI from './titleUI.vue'
import SIDEMENT from './SideMenu.vue'
import TOPNAVE from './TopNave.vue'
import AiAssistant from '@/views/ai-agent/index.vue'

onMounted(async () => {
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.admin-main {
  flex: 1;
  min-width: 0;
  padding-top: 3rem;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  background: #f5f7fb;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
}

.admin-main::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.admin-main::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}
</style>
