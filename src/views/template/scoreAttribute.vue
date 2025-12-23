<!-- filepath: d:\XMU\3UP\交互设计\codeGithub\idfrontend-admin\src\views\template\scoreAttribute.vue -->
<template>
    <div class="p-4">
      <el-card>
        <div class="flex justify-between mb-4">
          <h4 class="text-xl font-bold">规则属性管理</h4>
          <el-button type="primary" @click="openCreateDialog()">创建属性组</el-button>
        </div>
  
        <!-- 筛选区 -->
        <div class="mb-4 flex gap-4">
          <el-select v-model="filterType" placeholder="筛选类型" clearable @change="loadAttributes" style="width: 200px">
            <el-option label="条件模板" value="CONDITION" />
            <el-option label="换算模板" value="TRANSFORM" />
          </el-select>
          <el-input 
            v-model="filterCode"
            placeholder="搜索属性代码"
            clearable
            @change="loadAttributes"
            style="width: 200px"
          />
        </div>
  
        <!-- ✅ 树形表格展示 -->
        <el-table 
          :data="attributeTreeData" 
          border
          row-key="key"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          default-expand-all
        >
          <el-table-column prop="attributeCode" label="属性代码" width="200">
            <template #default="{ row }">
              <span :class="{ 'font-bold': !row.isChild }">{{ row.attributeCode }}</span>
            </template>
          </el-table-column>
  
          <el-table-column label="属性类型" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.attributeType" :type="row.attributeType === 'CONDITION' ? 'success' : 'warning'" size="small">
                {{ row.attributeType === 'CONDITION' ? '条件' : '换算' }}
              </el-tag>
            </template>
          </el-table-column>
  
          <el-table-column prop="attributeValue" label="属性值/公式" show-overflow-tooltip />
  
          <!-- ✅ 更新: 显示范围和单位 -->
          <el-table-column label="范围" width="150">
            <template #default="{ row }">
              <span v-if="row.isChild && row.inputMin !== undefined">
                {{ formatRange(row) }}
              </span>
            </template>
          </el-table-column>
  
          <!-- ✅ 新增: 单位列 -->
          <el-table-column label="单位" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isChild && row.inputUnit" size="small" type="info">
                {{ row.inputUnit }}
              </el-tag>
            </template>
          </el-table-column>
  
          <el-table-column prop="description" label="说明" show-overflow-tooltip />
  
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-space v-if="!row.isChild">
                <el-button size="small" type="warning" @click="openEditGroupDialog(row.attributeCode)">
                  编辑组
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteGroup(row.attributeCode)">
                  删除组
                </el-button>
              </el-space>
              <el-space v-else>
                <el-button size="small" type="primary" @click="openEditSingleDialog(row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteSingle(row.id)">
                  删除
                </el-button>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- ✅ 创建/编辑属性组弹窗 -->
      <el-dialog 
        v-model="groupDialogVisible" 
        :title="isEditGroup ? '编辑属性组' : '创建属性组'" 
        width="1000px"
        :close-on-click-modal="false"
      >
        <el-form :model="groupFormData" label-width="120px">
          <el-form-item label="属性代码" required>
            <el-input v-model="groupFormData.attributeCode" placeholder="如: project_level" :disabled="isEditGroup" />
          </el-form-item>
  
          <el-form-item label="属性类型" required>
            <el-radio-group v-model="groupFormData.attributeType">
              <el-radio label="CONDITION">条件模板</el-radio>
              <el-radio label="TRANSFORM">换算模板</el-radio>
            </el-radio-group>
          </el-form-item>
  
          <el-divider>属性列表</el-divider>
  
          <!-- ✅ 属性列表 -->
          <div v-for="(item, index) in groupFormData.attributes" :key="index" class="mb-4 p-4 border rounded">
            <div class="flex items-start gap-4">
              <div class="flex-1">
                <el-form-item label="属性值/公式" required>
                  <el-input v-model="item.attributeValue" placeholder="条件值或换算公式" />
                </el-form-item>
  
                <!-- ✅ 仅换算模板显示范围和单位 -->
                <div v-if="groupFormData.attributeType === 'TRANSFORM'" class="mt-2">
                  <el-row :gutter="10">
                    <el-col :span="6">
                      <el-form-item label="最小值">
                        <el-input-number v-model="item.inputMin" :precision="2" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="最大值">
                        <el-input-number v-model="item.inputMax" :precision="2" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="区间类型">
                        <el-select v-model="item.inputInterval" class="w-full">
                          <el-option label="[a, b]" value="CLOSED" />
                          <el-option label="(a, b)" value="OPEN" />
                          <el-option label="(a, b]" value="LEFT_OPEN" />
                          <el-option label="[a, b)" value="RIGHT_OPEN" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <!-- ✅ 新增: 单位输入 -->
                    <el-col :span="6">
                      <el-form-item label="单位">
                        <el-input v-model="item.inputUnit" placeholder="如: 小时/次/分" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
  
                <el-form-item label="说明">
                  <el-input v-model="item.description" type="textarea" :rows="2" />
                </el-form-item>
              </div>
  
              <el-button type="danger" @click="removeAttributeItem(index)" :disabled="groupFormData.attributes.length === 1">
                删除
              </el-button>
            </div>
          </div>
  
          <!-- ✅ 新增按钮 -->
          <el-button type="primary" @click="addAttributeItem" class="w-full" icon="Plus">
            添加属性
          </el-button>
        </el-form>
  
        <template #footer>
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGroupSubmit">保存</el-button>
        </template>
      </el-dialog>
  
      <!-- ✅ 编辑单个属性弹窗 -->
      <el-dialog 
        v-model="singleDialogVisible" 
        title="编辑属性" 
        width="600px"
      >
        <el-form :model="singleFormData" label-width="120px">
          <el-form-item label="属性值/公式" required>
            <el-input v-model="singleFormData.attributeValue" />
          </el-form-item>
  
          <!-- ✅ 仅换算模板显示 -->
          <div v-if="singleFormData.attributeType === 'TRANSFORM'">
            <el-form-item label="最小值">
              <el-input-number v-model="singleFormData.inputMin" :precision="2" class="w-full" />
            </el-form-item>
            <el-form-item label="最大值">
              <el-input-number v-model="singleFormData.inputMax" :precision="2" class="w-full" />
            </el-form-item>
            <el-form-item label="区间类型">
              <el-select v-model="singleFormData.inputInterval" class="w-full">
                <el-option label="[a, b]" value="CLOSED" />
                <el-option label="(a, b)" value="OPEN" />
                <el-option label="(a, b]" value="LEFT_OPEN" />
                <el-option label="[a, b)" value="RIGHT_OPEN" />
              </el-select>
            </el-form-item>
            <!-- ✅ 新增: 单位输入 -->
            <el-form-item label="单位">
              <el-input v-model="singleFormData.inputUnit" placeholder="如: 小时/次/分" />
            </el-form-item>
          </div>
  
          <el-form-item label="说明">
            <el-input v-model="singleFormData.description" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
  
        <template #footer>
          <el-button @click="singleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSingleSubmit">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import {
    type RuleAttribute,
    type AttributeGroupForm,
    type AttributeTreeNode,
    getAllAttributes,
    getAttributesByType,
    getAttributesByCode,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    deleteAttributesByCode
  } from '@/api/components/apiAttribute'
  
  const attributeList = ref<RuleAttribute[]>([])
  const groupDialogVisible = ref(false)
  const singleDialogVisible = ref(false)
  const isEditGroup = ref(false)
  const filterType = ref('')
  const filterCode = ref('')
  
  // ✅ 属性组表单数据
  const groupFormData = reactive<AttributeGroupForm>({
    attributeCode: '',
    attributeType: 'CONDITION',
    attributes: [
      {
        attributeValue: '',
        inputMax: null,
        inputMin: null,
        inputInterval: 'CLOSED',
        inputUnit: '',  // ✅ 新增
        displayOrder: 0,
        description: ''
      }
    ]
  })
  
  // ✅ 单个属性表单数据
  const singleFormData = reactive<RuleAttribute>({
    id: undefined,
    attributeCode: '',
    attributeType: 'CONDITION',
    attributeValue: '',
    inputMax: undefined,
    inputMin: undefined,
    inputInterval: 'CLOSED',
    inputUnit: '',  // ✅ 新增
    displayOrder: 0,
    description: ''
  })
  
  // ✅ 生成树形数据
  const attributeTreeData = computed<AttributeTreeNode[]>(() => {
    const groupMap = new Map<string, AttributeTreeNode>()
  
    attributeList.value.forEach(attr => {
      if (!groupMap.has(attr.attributeCode)) {
        groupMap.set(attr.attributeCode, {
          key: attr.attributeCode,
          attributeCode: attr.attributeCode,
          attributeType: attr.attributeType,
          isChild: false,
          hasChildren: true,
          children: []
        })
      }
  
      groupMap.get(attr.attributeCode)!.children!.push({
        key: `${attr.attributeCode}-${attr.id}`,
        attributeCode: attr.attributeCode,
        id: attr.id,
        attributeType: attr.attributeType,
        attributeValue: attr.attributeValue,
        inputMax: attr.inputMax,
        inputMin: attr.inputMin,
        inputInterval: attr.inputInterval,
        inputUnit: attr.inputUnit,  // ✅ 新增
        description: attr.description,
        isChild: true
      })
    })
  
    return Array.from(groupMap.values())
  })
  
  // ✅ 格式化范围显示
  const formatRange = (row: AttributeTreeNode) => {
    if (!row.inputMin || !row.inputMax) return '-'
    const left = row.inputInterval === 'OPEN' || row.inputInterval === 'LEFT_OPEN' ? '(' : '['
    const right = row.inputInterval === 'OPEN' || row.inputInterval === 'RIGHT_OPEN' ? ')' : ']'
    return `${left}${row.inputMin}, ${row.inputMax}${right}`
  }
  
  const loadAttributes = async () => {
    try {
      let response
      if (filterType.value) {
        response = await getAttributesByType(filterType.value as 'CONDITION' | 'TRANSFORM')
      } else if (filterCode.value) {
        response = await getAttributesByCode(filterCode.value)
      } else {
        response = await getAllAttributes()
      }
      
      if (response.code === 200) {
        attributeList.value = response.data
      }
    } catch (error) {
      ElMessage.error('加载失败')
    }
  }
  
  const openCreateDialog = () => {
    isEditGroup.value = false
    Object.assign(groupFormData, {
      attributeCode: '',
      attributeType: 'CONDITION',
      attributes: [{
        attributeValue: '',
        inputMax: null,
        inputMin: null,
        inputInterval: 'CLOSED',
        inputUnit: '',  // ✅ 新增
        displayOrder: 0,
        description: ''
      }]
    })
    groupDialogVisible.value = true
  }
  
  const openEditGroupDialog = async (code: string) => {
    try {
      const response = await getAttributesByCode(code)
      if (response.code === 200) {
        const attrs = response.data
        isEditGroup.value = true
        groupFormData.attributeCode = code
        groupFormData.attributeType = attrs[0].attributeType
        groupFormData.attributes = attrs.map((a: RuleAttribute) => ({
          id: a.id,
          attributeValue: a.attributeValue,
          inputMax: a.inputMax,
          inputMin: a.inputMin,
          inputInterval: a.inputInterval,
          inputUnit: a.inputUnit,  // ✅ 新增
          displayOrder: a.displayOrder,
          description: a.description
        }))
        groupDialogVisible.value = true
      }
    } catch (error) {
      ElMessage.error('加载失败')
    }
  }
  
  const addAttributeItem = () => {
    groupFormData.attributes.push({
      attributeValue: '',
      inputMax: null,
      inputMin: null,
      inputInterval: 'CLOSED',
      inputUnit: '',  // ✅ 新增
      displayOrder: groupFormData.attributes.length,
      description: ''
    })
  }
  
  const removeAttributeItem = (index: number) => {
    groupFormData.attributes.splice(index, 1)
  }
  
  const handleGroupSubmit = async () => {
    try {
      if (!groupFormData.attributeCode) {
        ElMessage.warning('请填写属性代码')
        return
      }
  
      const hasEmptyValue = groupFormData.attributes.some(attr => !attr.attributeValue)
      if (hasEmptyValue) {
        ElMessage.warning('请填写所有属性值')
        return
      }
  
      if (groupFormData.attributeType === 'TRANSFORM') {
        const hasInvalidRange = groupFormData.attributes.some(attr => 
          attr.inputMin === null || attr.inputMax === null
        )
        if (hasInvalidRange) {
          ElMessage.warning('换算模板必须设置范围')
          return
        }
      }
  
      for (const attr of groupFormData.attributes) {
        const data: RuleAttribute = {
          attributeCode: groupFormData.attributeCode,
          attributeType: groupFormData.attributeType,
          attributeValue: attr.attributeValue,
          inputMax: attr.inputMax || undefined,
          inputMin: attr.inputMin || undefined,
          inputInterval: attr.inputInterval,
          inputUnit: attr.inputUnit,  // ✅ 新增
          displayOrder: attr.displayOrder,
          description: attr.description
        }
  
        if (attr.id) {
          await updateAttribute(attr.id, data)
        } else {
          await createAttribute(data)
        }
      }
  
      ElMessage.success('保存成功')
      groupDialogVisible.value = false
      loadAttributes()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  }
  
  const openEditSingleDialog = (row: AttributeTreeNode) => {
    Object.assign(singleFormData, {
      id: row.id,
      attributeCode: row.attributeCode,
      attributeType: row.attributeType,
      attributeValue: row.attributeValue,
      inputMax: row.inputMax,
      inputMin: row.inputMin,
      inputInterval: row.inputInterval,
      inputUnit: row.inputUnit,  // ✅ 新增
      displayOrder: row.displayOrder ?? 0,
      description: row.description
    })
    singleDialogVisible.value = true
  }
  
  const handleSingleSubmit = async () => {
    try {
      if (!singleFormData.attributeValue) {
        ElMessage.warning('请填写属性值')
        return
      }
  
      if (singleFormData.attributeType === 'TRANSFORM') {
        if (singleFormData.inputMin === undefined || singleFormData.inputMax === undefined) {
          ElMessage.warning('换算模板必须设置范围')
          return
        }
      }
  
      const response = await updateAttribute(singleFormData.id!, singleFormData)
  
      if (response.code === 200) {
        ElMessage.success('保存成功')
        singleDialogVisible.value = false
        loadAttributes()
      } else {
        ElMessage.error(response.msg || '保存失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  }
  
  const handleDeleteGroup = async (code: string) => {
    try {
      await ElMessageBox.confirm(`确定删除属性组 "${code}" 及其所有属性?`, '提示', { 
        type: 'warning' 
      })
  
      await deleteAttributesByCode(code)
      ElMessage.success('删除成功')
      loadAttributes()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }
  
  const handleDeleteSingle = async (id: number | undefined) => {
    if (!id) return
    
    try {
      await ElMessageBox.confirm('确定删除此属性?', '提示', { type: 'warning' })
      const response = await deleteAttribute(id)
      
      if (response.code === 200) {
        ElMessage.success('删除成功')
        loadAttributes()
      } else {
        ElMessage.error(response.msg || '删除失败')
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }
  
  onMounted(() => {
    loadAttributes()
  })
  </script>
  
  <style scoped>
  .font-bold {
    font-weight: 600;
    font-size: 14px;
  }
  </style>