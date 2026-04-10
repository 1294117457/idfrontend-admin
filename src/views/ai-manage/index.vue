<template>
  <div class="p-6">
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="AI 配置" name="config">
          <AiConfigPanel />
        </el-tab-pane>
        <el-tab-pane label="AI 知识库" name="knowledge">
          <KnowledgePanel />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AiConfigPanel from './AiConfigPanel.vue'
import KnowledgePanel from './KnowledgePanel.vue'

const activeTab = ref('config')
</script>
