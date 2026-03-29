<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">字段管理（分数维度 + 需求条件）</span>
          <el-button type="primary" size="small" @click="openAddFieldDialog">新增字段</el-button>
        </div>
      </template>

      <el-table :data="fieldConfigs" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="fieldKey" label="键名" width="180" />
        <el-table-column prop="displayName" label="显示名称" width="150" />
        <el-table-column prop="fieldType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.fieldType === 'SCORE' ? 'primary' : 'warning'" size="small">
              {{ row.fieldType === 'SCORE' ? '计分' : '需求' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxScore" label="上限分" width="90" />
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditFieldDialog(row)">编辑</el-button>
            <el-button
              v-if="row.fieldType === 'SCORE'"
              size="small"
              type="primary"
              @click="openSubcategoryDialog(row)"
            >
              细分类别
            </el-button>
            <el-button size="small" type="danger" @click="handleDeleteField(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ========== 细分类别弹窗 ========== -->
    <el-dialog
      v-model="subcategoryDialogVisible"
      :title="`「${selectedField?.displayName || ''}」的细分类别管理`"
      width="700px"
    >
      <div class="flex justify-end mb-3">
        <el-button type="primary" size="small" @click="openAddSubcategoryDialog">新增细分</el-button>
      </div>

      <el-table :data="subcategories" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="subKey" label="键名" width="100" />
        <el-table-column prop="displayName" label="名称" width="150" />
        <el-table-column prop="maxScore" label="上限分" width="90" />
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditSubcategoryDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteSubcategory(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="subcategoryDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 新增/编辑字段弹窗 ========== -->
    <el-dialog v-model="fieldDialogVisible" :title="fieldForm.id ? '编辑字段' : '新增字段'" width="500px">
      <el-form :model="fieldForm" label-width="100px">
        <el-form-item label="键名" required>
          <el-input v-model="fieldForm.fieldKey" placeholder="如 specialty / demand_english" />
        </el-form-item>
        <el-form-item label="显示名称" required>
          <el-input v-model="fieldForm.displayName" placeholder="如 学术专长" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="fieldForm.fieldType" class="w-full">
            <el-option label="计分维度 (SCORE)" value="SCORE" />
            <el-option label="需求条件 (DEMAND)" value="DEMAND" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'SCORE'" label="上限分">
          <el-input-number v-model="fieldForm.maxScore" :min="0" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'DEMAND'" label="选项列表">
          <el-input v-model="fieldForm.conditions" placeholder='JSON 数组，如 ["CET4","CET6"]，无选项留空' />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="fieldForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="fieldForm.sortOrder" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="fieldForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fieldDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveField">确定</el-button>
      </template>
    </el-dialog>

    <!-- ========== 新增/编辑细分类别弹窗 ========== -->
    <el-dialog v-model="subDialogVisible" :title="subForm.id ? '编辑细分类别' : '新增细分类别'" width="450px">
      <el-form :model="subForm" label-width="100px">
        <el-form-item label="键名" required>
          <el-input v-model="subForm.subKey" placeholder="如 A / B / C" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="subForm.displayName" placeholder="如 A类竞赛（国家级）" />
        </el-form-item>
        <el-form-item label="上限分" required>
          <el-input-number v-model="subForm.maxScore" :min="0" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="subForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="subForm.sortOrder" :min="0" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveSubcategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAllFieldConfigs,
  createFieldConfig,
  updateFieldConfig,
  deleteFieldConfig,
  getSubcategoryList,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type FieldConfig,
  type FieldSubcategory
} from '@/api/components/apiFieldConfig'

// ==================== 字段配置 ====================
const fieldConfigs = ref<FieldConfig[]>([])
const fieldDialogVisible = ref(false)
const saving = ref(false)

const emptyField = (): Partial<FieldConfig> & { id?: number } => ({
  id: undefined,
  fieldKey: '',
  displayName: '',
  fieldType: 'SCORE',
  maxScore: undefined,
  conditions: '',
  description: '',
  sortOrder: 0,
  isActive: true
})

const fieldForm = ref<Partial<FieldConfig> & { id?: number }>(emptyField())

const loadFieldConfigs = async () => {
  const res = await getAllFieldConfigs()
  if (res.code === 200) fieldConfigs.value = res.data
}

const openAddFieldDialog = () => {
  fieldForm.value = emptyField()
  fieldDialogVisible.value = true
}

const openEditFieldDialog = (row: FieldConfig) => {
  fieldForm.value = { ...row }
  fieldDialogVisible.value = true
}

const handleSaveField = async () => {
  if (!fieldForm.value.fieldKey || !fieldForm.value.displayName) {
    ElMessage.warning('请填写键名和显示名称')
    return
  }
  saving.value = true
  try {
    const payload = { ...fieldForm.value }
    if (!payload.conditions || payload.conditions.trim() === '') payload.conditions = undefined as any
    if (payload.fieldType !== 'SCORE') payload.maxScore = undefined as any

    let res
    if (fieldForm.value.id) {
      res = await updateFieldConfig(fieldForm.value.id, payload as FieldConfig)
    } else {
      res = await createFieldConfig(payload as Omit<FieldConfig, 'id'>)
    }
    if (res.code === 200) {
      ElMessage.success('保存成功')
      fieldDialogVisible.value = false
      await loadFieldConfigs()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteField = async (id: number) => {
  await ElMessageBox.confirm('确认删除该字段配置？', '提示', { type: 'warning' })
  const res = await deleteFieldConfig(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await loadFieldConfigs()
    if (selectedField.value?.id === id) selectedField.value = null
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

// ==================== 细分类别 ====================
const selectedField = ref<FieldConfig | null>(null)
const subcategories = ref<FieldSubcategory[]>([])
const subDialogVisible = ref(false)
const subcategoryDialogVisible = ref(false)

const emptySub = (): Partial<FieldSubcategory> & { id?: number } => ({
  id: undefined,
  subKey: '',
  displayName: '',
  maxScore: 0,
  description: '',
  sortOrder: 0
})

const subForm = ref<Partial<FieldSubcategory> & { id?: number }>(emptySub())

const openSubcategoryPanel = async (field: FieldConfig) => {
  selectedField.value = field
  const res = await getSubcategoryList(field.id)
  if (res.code === 200) subcategories.value = res.data
}

const openSubcategoryDialog = async (field: FieldConfig) => {
  await openSubcategoryPanel(field)
  subcategoryDialogVisible.value = true
}

const openAddSubcategoryDialog = () => {
  subForm.value = emptySub()
  subDialogVisible.value = true
}

const openEditSubcategoryDialog = (row: FieldSubcategory) => {
  subForm.value = { ...row }
  subDialogVisible.value = true
}

const handleSaveSubcategory = async () => {
  if (!subForm.value.subKey || !subForm.value.displayName) {
    ElMessage.warning('请填写键名和名称')
    return
  }
  saving.value = true
  try {
    let res
    if (subForm.value.id) {
      res = await updateSubcategory(subForm.value.id, subForm.value as FieldSubcategory)
    } else {
      const payload = { ...subForm.value, fieldId: selectedField.value!.id, isActive: true }
      res = await createSubcategory(payload as Omit<FieldSubcategory, 'id'>)
    }
    if (res.code === 200) {
      ElMessage.success('保存成功')
      subDialogVisible.value = false
      await openSubcategoryPanel(selectedField.value!)
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteSubcategory = async (id: number) => {
  await ElMessageBox.confirm('确认删除该细分类别？', '提示', { type: 'warning' })
  const res = await deleteSubcategory(id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await openSubcategoryPanel(selectedField.value!)
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

onMounted(() => {
  loadFieldConfigs()
})
</script>
