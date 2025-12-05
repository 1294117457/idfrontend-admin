<template>
    <div class="p-4">
      <el-card>
        <div class="flex justify-between mb-4">
          <h4 class="text-xl font-bold">需求模板管理</h4>
          <el-button type="primary" @click="openDialog()">创建模板</el-button>
        </div>
        
        <el-table :data="templateList" border stripe>
          <el-table-column prop="templateName" label="模板名称" min-width="150" />
          
          <el-table-column label="条件字段" min-width="200">
            <template #default="{ row }">
              <div v-if="row.conditions && row.conditions.length > 0">
                <el-tag 
                  v-for="(condition, index) in row.conditions" 
                  :key="index" 
                  class="mr-1 mb-1"
                  size="small"
                >
                  {{ condition }}
                </el-tag>
              </div>
              <span v-else class="text-gray-400">无条件</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
          
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive === 1 ? 'success' : 'info'">
                {{ row.isActive === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
          
          <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
          
          <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-space>
                <el-button size="small" type="warning" @click="openEditDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 创建/编辑模板弹窗 -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="isEdit ? '编辑模板' : '创建模板'" 
        width="700px"
        :close-on-click-modal="false"
      >
        <el-form :model="formData" label-width="120px">
          <el-form-item label="模板名称" required>
            <el-input 
              v-model="formData.templateName" 
              placeholder="请输入模板名称，如：英语水平、科研能力等" 
              clearable
            />
          </el-form-item>
          
          <el-form-item label="条件字段">
            <div class="w-full">
              <div class="mb-2 text-sm text-gray-500">
                添加需要学生填写的条件字段（可选），例如：四级成绩、六级成绩、雅思成绩等
              </div>
              <div class="flex gap-2 mb-2">
                <el-input 
                  v-model="newCondition" 
                  placeholder="输入条件名称，如：四级成绩"
                  @keyup.enter="addCondition"
                  clearable
                />
                <el-button type="primary" @click="addCondition">添加</el-button>
              </div>
              
              <div v-if="formData.conditions && formData.conditions.length > 0" class="mt-3">
                <el-tag
                  v-for="(condition, index) in formData.conditions"
                  :key="index"
                  closable
                  @close="removeCondition(index)"
                  class="mr-2 mb-2"
                >
                  {{ condition }}
                </el-tag>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="说明">
            <el-input 
              v-model="formData.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入模板说明，如：用于评估学生的英语水平"
            />
          </el-form-item>
          
          <el-form-item label="排序" required>
            <el-input-number 
              v-model="formData.sortOrder" 
              :min="0" 
              :max="999"
              placeholder="数值越小越靠前"
            />
            <span class="ml-2 text-sm text-gray-500">数值越小排序越靠前</span>
          </el-form-item>
          
          <el-form-item label="状态" required>
            <el-radio-group v-model="formData.isActive">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
  
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">
              {{ isEdit ? '更新' : '创建' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { 
    getAllTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    type DemandTemplate
  } from '@/api/components/apiDemand'
  
  const templateList = ref<DemandTemplate[]>([])
  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const submitting = ref(false)
  const newCondition = ref('')
  
  const formData = reactive<DemandTemplate>({
    templateName: '',
    conditions: [],
    description: '',
    sortOrder: 0,
    isActive: 1
  })
  
  // 加载模板列表
  const loadTemplates = async () => {
    try {
      const response = await getAllTemplates()
      if (response.code === 200) {
        templateList.value = response.data || []
      } else {
        ElMessage.error(response.msg || '加载失败')
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      ElMessage.error('加载模板失败')
    }
  }
  
  // 打开创建弹窗
  const openDialog = () => {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }
  
  // 打开编辑弹窗
  const openEditDialog = (row: DemandTemplate) => {
    isEdit.value = true
    Object.assign(formData, {
      id: row.id,
      templateName: row.templateName,
      conditions: row.conditions ? [...row.conditions] : [],
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive
    })
    dialogVisible.value = true
  }
  
  // 添加条件
  const addCondition = () => {
    if (!newCondition.value.trim()) {
      ElMessage.warning('请输入条件名称')
      return
    }
    
    if (!formData.conditions) {
      formData.conditions = []
    }
    
    if (formData.conditions.includes(newCondition.value.trim())) {
      ElMessage.warning('该条件已存在')
      return
    }
    
    formData.conditions.push(newCondition.value.trim())
    newCondition.value = ''
  }
  
  // 移除条件
  const removeCondition = (index: number) => {
    formData.conditions?.splice(index, 1)
  }
  
  // 提交表单
  const handleSubmit = async () => {
    if (!formData.templateName.trim()) {
      ElMessage.warning('请输入模板名称')
      return
    }
    
    submitting.value = true
    try {
      const data = {
        ...formData,
        conditions: formData.conditions && formData.conditions.length > 0 
          ? formData.conditions 
          : undefined
      }
      
      let response
      if (isEdit.value && formData.id) {
        response = await updateTemplate(formData.id, data)
      } else {
        response = await createTemplate(data)
      }
      
      if (response.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadTemplates()
      } else {
        ElMessage.error(response.msg || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  }
  
  // 删除模板
  const handleDelete = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除该模板吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      
      const response = await deleteTemplate(id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        loadTemplates()
      } else {
        ElMessage.error(response.msg || '删除失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
  }
  
  // 重置表单
  const resetForm = () => {
    Object.assign(formData, {
      id: undefined,
      templateName: '',
      conditions: [],
      description: '',
      sortOrder: 0,
      isActive: 1
    })
    newCondition.value = ''
  }
  
  // 格式化时间
  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return '-'
    try {
      return new Date(datetime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return datetime
    }
  }
  
  onMounted(() => {
    loadTemplates()
  })
  </script>
  
  <style scoped>
  :deep(.el-input-number) {
    width: 150px;
  }
  </style>