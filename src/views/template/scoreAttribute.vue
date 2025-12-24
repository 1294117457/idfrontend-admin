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
          @clear="loadAttributes"
          @keyup.enter="loadAttributes"
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
            <el-tag v-if="row.attributeType === 'CONDITION'" type="success">条件模板</el-tag>
            <el-tag v-else-if="row.attributeType === 'TRANSFORM'" type="primary">换算模板</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="attributeValue" label="属性值/公式" show-overflow-tooltip />

        <!-- ✅ 范围显示 -->
        <el-table-column label="范围" width="150">
          <template #default="{ row }">
            <span v-if="row.isChild && row.attributeType === 'TRANSFORM'">
              {{ formatRange(row) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="说明" show-overflow-tooltip />

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <!-- ✅ 只有父节点(属性组)才显示操作按钮 -->
            <template v-if="!row.isChild">
              <el-button type="primary" size="small" @click="openEditGroupDialog(row.attributeCode)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteGroup(row.attributeCode)">
                删除
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

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
            <el-radio-group v-model="groupFormData.attributeType" :disabled="isEditGroup">
              <el-radio label="CONDITION">条件模板</el-radio>
              <el-radio label="TRANSFORM">换算模板</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-divider>
            <div class="flex items-center gap-2">
              <span>属性列表</span>
              <!-- ✅ 新增属性按钮 -->
              <el-button type="primary" size="small" :icon="Plus" @click="addAttributeItem">
                新增属性
              </el-button>
            </div>
          </el-divider>

          <!-- ✅ 属性列表 -->
          <div v-for="(item, index) in groupFormData.attributes" :key="index" class="mb-4 p-4 border rounded">
            <div class="flex items-start gap-4">
              <div class="flex-1">
                <el-form-item label="属性值/公式" required>
                  <el-input v-model="item.attributeValue" placeholder="条件值或换算公式" />
                </el-form-item>

                <!-- 仅换算模板显示范围 -->
                <div v-if="groupFormData.attributeType === 'TRANSFORM'" class="mt-2">
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <el-form-item label="最小值">
                        <el-input-number v-model="item.inputMin" :precision="2" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="最大值">
                        <el-input-number v-model="item.inputMax" :precision="2" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="区间类型">
                        <el-select v-model="item.inputInterval" class="w-full">
                          <el-option label="[a, b]" value="CLOSED" />
                          <el-option label="(a, b)" value="OPEN" />
                          <el-option label="(a, b]" value="LEFT_OPEN" />
                          <el-option label="[a, b)" value="RIGHT_OPEN" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>

                <el-form-item label="说明">
                  <el-input v-model="item.description" type="textarea" :rows="2" />
                </el-form-item>
              </div>

              <!-- ✅ 删除按钮 -->
              <el-button type="danger" @click="removeAttributeItem(index)">删除</el-button>
            </div>
          </div>

          <!-- ✅ 提示:至少需要一个属性 -->
          <el-alert v-if="groupFormData.attributes.length === 0" 
            title="请至少添加一个属性" 
            type="warning" 
            :closable="false" 
          />
        </el-form>

        <template #footer>
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGroupSubmit" :disabled="groupFormData.attributes.length === 0">
            保存
          </el-button>
        </template>
      </el-dialog>
    </el-card>
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
  deleteAttribute,
  deleteAttributesByCode
} from '@/api/components/apiAttribute'

const attributeList = ref<RuleAttribute[]>([])
const groupDialogVisible = ref(false)
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
      displayOrder: 0,
      description: ''
    }
  ]
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
        displayOrder: a.displayOrder,
        description: a.description
      }))
      groupDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

// ✅ 新增属性项
const addAttributeItem = () => {
  groupFormData.attributes.push({
    attributeValue: '',
    inputMax: null,
    inputMin: null,
    inputInterval: 'CLOSED',
    displayOrder: groupFormData.attributes.length,
    description: ''
  })
}

// ✅ 移除属性项(至少保留一个)
const removeAttributeItem = (index: number) => {
  if (groupFormData.attributes.length <= 1) {
    ElMessage.warning('至少需要保留一个属性')
    return
  }
  groupFormData.attributes.splice(index, 1)
}

// ✅ 提交逻辑(检查重复)
const handleGroupSubmit = async () => {
  try {
    if (!groupFormData.attributeCode) {
      ElMessage.warning('请输入属性代码')
      return
    }

    const hasEmptyValue = groupFormData.attributes.some(attr => !attr.attributeValue)
    if (hasEmptyValue) {
      ElMessage.warning('请填写所有属性值/公式')
      return
    }

    if (groupFormData.attributeType === 'TRANSFORM') {
      const hasInvalidRange = groupFormData.attributes.some(attr => 
        attr.inputMin == null || attr.inputMax == null || attr.inputMin >= attr.inputMax
      )
      if (hasInvalidRange) {
        ElMessage.warning('换算模板必须设置有效的范围(最小值 < 最大值)')
        return
      }
    }

    // ✅ 检查是否有重复的属性值
    const valueSet = new Set(groupFormData.attributes.map(attr => attr.attributeValue))
    if (valueSet.size !== groupFormData.attributes.length) {
      ElMessage.warning('属性值不能重复')
      return
    }

    // ✅ 如果是编辑模式,先删除旧属性再创建新属性(避免唯一键冲突)
    if (isEditGroup.value) {
      await deleteAttributesByCode(groupFormData.attributeCode)
    }

    // 创建所有属性
    for (const attr of groupFormData.attributes) {
      const payload: RuleAttribute = {
        attributeCode: groupFormData.attributeCode,
        attributeType: groupFormData.attributeType,
        attributeValue: attr.attributeValue,
        inputMax: attr.inputMax,
        inputMin: attr.inputMin,
        inputInterval: attr.inputInterval,
        displayOrder: attr.displayOrder,
        description: attr.description,
        isActive: true
      }

      const response = await createAttribute(payload)
      if (response.code !== 200) {
        throw new Error(response.msg || '创建失败')
      }
    }

    ElMessage.success('保存成功')
    groupDialogVisible.value = false
    loadAttributes()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败: ' + (error as Error).message)
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