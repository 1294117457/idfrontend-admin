<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">字段管理（分数维度 + 需求条件）</span>
          <el-button type="primary" size="small" @click="openAddFieldDialog">新增字段</el-button>
        </div>
      </template>

      <el-table
        :data="fieldConfigs"
        border
        stripe
        row-key="id"
        :row-class-name="getRowClassName"
        @expand-change="handleExpandChange"
      >
        <!-- ① 展开列 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="row.fieldType === 'SCORE'" class="px-6 py-3 bg-gray-50">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-sm text-gray-700">
                  「{{ row.displayName }}」细分类别
                </span>
                <el-button size="small" type="primary" @click="openAddSubcategoryDialog(row)">
                  新增细分
                </el-button>
              </div>
              <el-table
                :data="subcategoryMap[row.id] || []"
                border
                size="small"
                v-loading="!!loadingSubs[row.id]"
              >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="subKey" label="键名" width="110">
                  <template #default="{ row: sub }">
                    <el-input v-if="editingSubId === sub.id" v-model="editSubForm.subKey" size="small" />
                    <span v-else>{{ sub.subKey }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="displayName" label="名称" width="160">
                  <template #default="{ row: sub }">
                    <el-input v-if="editingSubId === sub.id" v-model="editSubForm.displayName" size="small" />
                    <span v-else>{{ sub.displayName }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="maxScore" label="上限分" width="110">
                  <template #default="{ row: sub }">
                    <el-input-number
                      v-if="editingSubId === sub.id"
                      v-model="editSubForm.maxScore"
                      size="small"
                      :min="0"
                      :precision="2"
                      style="width:100%"
                    />
                    <span v-else>{{ sub.maxScore }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="sortOrder" label="排序" width="80">
                  <template #default="{ row: sub }">
                    <el-input-number
                      v-if="editingSubId === sub.id"
                      v-model="editSubForm.sortOrder"
                      size="small"
                      :min="0"
                      style="width:100%"
                    />
                    <span v-else>{{ sub.sortOrder }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="180">
                  <template #default="{ row: sub }">
                    <el-input v-if="editingSubId === sub.id" v-model="editSubForm.description" size="small" />
                    <span v-else>{{ sub.description }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row: sub }">
                    <template v-if="editingSubId === sub.id">
                      <el-button size="small" type="primary" :loading="saving" @click="handleSaveSubInline">保存</el-button>
                      <el-button size="small" @click="cancelEditSub">取消</el-button>
                    </template>
                    <template v-else>
                      <el-button size="small" @click="startEditSub(sub)">编辑</el-button>
                      <el-button size="small" type="danger" @click="handleDeleteSubcategory(sub.id, row.id)">删除</el-button>
                    </template>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="px-6 py-3 text-gray-400 text-sm bg-gray-50">
              需求条件字段无细分类别
            </div>
          </template>
        </el-table-column>

        <!-- ② 主字段列（行内编辑） -->
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="fieldKey" label="键名" width="180">
          <template #default="{ row }">
            <el-input v-if="editingFieldId === row.id" v-model="editFieldForm.fieldKey" size="small" />
            <span v-else>{{ row.fieldKey }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="displayName" label="显示名称" width="150">
          <template #default="{ row }">
            <el-input v-if="editingFieldId === row.id" v-model="editFieldForm.displayName" size="small" />
            <span v-else>{{ row.displayName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fieldType" label="类型" width="130">
          <template #default="{ row }">
            <el-select
              v-if="editingFieldId === row.id"
              v-model="editFieldForm.fieldType"
              size="small"
              style="width:110px"
            >
              <el-option label="计分 (SCORE)" value="SCORE" />
              <el-option label="需求 (DEMAND)" value="DEMAND" />
            </el-select>
            <el-tag v-else :type="row.fieldType === 'SCORE' ? 'primary' : 'warning'" size="small">
              {{ row.fieldType === 'SCORE' ? '计分' : '需求' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxScore" label="上限分" width="110">
          <template #default="{ row }">
            <el-input-number
              v-if="editingFieldId === row.id && editFieldForm.fieldType === 'SCORE'"
              v-model="editFieldForm.maxScore"
              size="small"
              :min="0"
              :precision="2"
              style="width:100%"
            />
            <span v-else>{{ row.fieldType === 'SCORE' ? (row.maxScore ?? '-') : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80">
          <template #default="{ row }">
            <el-input-number
              v-if="editingFieldId === row.id"
              v-model="editFieldForm.sortOrder"
              size="small"
              :min="0"
              style="width:100%"
            />
            <span v-else>{{ row.sortOrder }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-if="editingFieldId === row.id" v-model="editFieldForm.isActive" size="small" />
            <el-tag v-else :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-input v-if="editingFieldId === row.id" v-model="editFieldForm.description" size="small" />
            <span v-else>{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="editingFieldId === row.id">
              <el-button size="small" type="primary" :loading="saving" @click="handleSaveFieldInline">保存</el-button>
              <el-button size="small" @click="cancelEditField">取消</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="startEditField(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteField(row.id)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ========== 新增字段弹窗（仅用于新增） ========== -->
    <el-dialog v-model="fieldDialogVisible" title="新增字段" width="500px">
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
        <el-button type="primary" :loading="saving" @click="handleSaveNewField">确定</el-button>
      </template>
    </el-dialog>

    <!-- ========== 新增细分类别弹窗（仅用于新增） ========== -->
    <el-dialog v-model="subDialogVisible" title="新增细分类别" width="450px">
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
        <el-button type="primary" :loading="saving" @click="handleSaveNewSub">确定</el-button>
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
} from '@/api/modules/apiFieldConfig'

// ==================== 字段配置 ====================
const fieldConfigs = ref<FieldConfig[]>([])
const saving = ref(false)

// 新增字段弹窗
const fieldDialogVisible = ref(false)
const fieldForm = ref<Partial<FieldConfig> & { id?: number }>({
  fieldKey: '', displayName: '', fieldType: 'SCORE',
  maxScore: undefined, conditions: '', description: '', sortOrder: 0, isActive: true
})

// 行内编辑 - 字段
const editingFieldId = ref<number | null>(null)
const editFieldForm = ref<Partial<FieldConfig>>({})

const loadFieldConfigs = async () => {
  const res = await getAllFieldConfigs()
  if (res.code === 200) fieldConfigs.value = res.data
}

const openAddFieldDialog = () => {
  fieldForm.value = {
    fieldKey: '', displayName: '', fieldType: 'SCORE',
    maxScore: undefined, conditions: '', description: '', sortOrder: 0, isActive: true
  }
  fieldDialogVisible.value = true
}

const startEditField = (row: FieldConfig) => {
  editingFieldId.value = row.id
  editFieldForm.value = { ...row }
}

const cancelEditField = () => {
  editingFieldId.value = null
}

const handleSaveNewField = async () => {
  if (!fieldForm.value.fieldKey || !fieldForm.value.displayName) {
    ElMessage.warning('请填写键名和显示名称')
    return
  }
  saving.value = true
  try {
    const payload = { ...fieldForm.value }
    if (!payload.conditions || (payload.conditions as string).trim() === '') payload.conditions = undefined as any
    if (payload.fieldType !== 'SCORE') payload.maxScore = undefined as any
    const res = await createFieldConfig(payload as Omit<FieldConfig, 'id'>)
    if (res.code === 200) {
      ElMessage.success('新增成功')
      fieldDialogVisible.value = false
      await loadFieldConfigs()
    } else {
      ElMessage.error(res.msg || '新增失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '新增失败')
  } finally {
    saving.value = false
  }
}

const handleSaveFieldInline = async () => {
  if (!editFieldForm.value.fieldKey || !editFieldForm.value.displayName) {
    ElMessage.warning('请填写键名和显示名称')
    return
  }
  saving.value = true
  try {
    const payload = { ...editFieldForm.value }
    if (!payload.conditions || (payload.conditions as string).trim() === '') payload.conditions = undefined as any
    if (payload.fieldType !== 'SCORE') payload.maxScore = undefined as any
    const res = await updateFieldConfig(editingFieldId.value!, payload as FieldConfig)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      editingFieldId.value = null
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
  try {
    await ElMessageBox.confirm('确认删除该字段配置？', '提示', { type: 'warning' })
    const res = await deleteFieldConfig(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadFieldConfigs()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch { /* cancelled */ }
}

const getRowClassName = ({ row }: { row: FieldConfig }) =>
  row.fieldType === 'DEMAND' ? 'demand-row' : ''

// ==================== 细分类别 ====================
const subcategoryMap = ref<Record<number, FieldSubcategory[]>>({})
const loadingSubs = ref<Record<number, boolean>>({})

// 行内编辑 - 细分
const editingSubId = ref<number | null>(null)
const editSubForm = ref<Partial<FieldSubcategory>>({})

// 新增细分弹窗
const subDialogVisible = ref(false)
const subForm = ref<Partial<FieldSubcategory>>({
  subKey: '', displayName: '', maxScore: 0, description: '', sortOrder: 0
})
const addingSubFieldId = ref<number | null>(null)

const handleExpandChange = async (row: FieldConfig) => {
  if (row.fieldType !== 'SCORE') return
  if (subcategoryMap.value[row.id]) return // already loaded
  loadingSubs.value[row.id] = true
  try {
    const res = await getSubcategoryList(row.id)
    if (res.code === 200) subcategoryMap.value[row.id] = res.data
  } finally {
    loadingSubs.value[row.id] = false
  }
}

const refreshSubs = async (fieldId: number) => {
  const res = await getSubcategoryList(fieldId)
  if (res.code === 200) subcategoryMap.value[fieldId] = res.data
}

const openAddSubcategoryDialog = (field: FieldConfig) => {
  addingSubFieldId.value = field.id
  subForm.value = { subKey: '', displayName: '', maxScore: 0, description: '', sortOrder: 0 }
  subDialogVisible.value = true
}

const handleSaveNewSub = async () => {
  if (!subForm.value.subKey || !subForm.value.displayName) {
    ElMessage.warning('请填写键名和名称')
    return
  }
  saving.value = true
  try {
    const payload = { ...subForm.value, fieldId: addingSubFieldId.value!, isActive: true }
    const res = await createSubcategory(payload as Omit<FieldSubcategory, 'id'>)
    if (res.code === 200) {
      ElMessage.success('新增成功')
      subDialogVisible.value = false
      await refreshSubs(addingSubFieldId.value!)
    } else {
      ElMessage.error(res.msg || '新增失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '新增失败')
  } finally {
    saving.value = false
  }
}

const startEditSub = (sub: FieldSubcategory) => {
  editingSubId.value = sub.id
  editSubForm.value = { ...sub }
}

const cancelEditSub = () => {
  editingSubId.value = null
}

const handleSaveSubInline = async () => {
  if (!editSubForm.value.subKey || !editSubForm.value.displayName) {
    ElMessage.warning('请填写键名和名称')
    return
  }
  saving.value = true
  try {
    const res = await updateSubcategory(editingSubId.value!, editSubForm.value as FieldSubcategory)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      const fieldId = editSubForm.value.fieldId!
      editingSubId.value = null
      await refreshSubs(fieldId)
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteSubcategory = async (id: number, fieldId: number) => {
  try {
    await ElMessageBox.confirm('确认删除该细分类别？', '提示', { type: 'warning' })
    const res = await deleteSubcategory(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await refreshSubs(fieldId)
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch { /* cancelled */ }
}

onMounted(() => {
  loadFieldConfigs()
})
</script>

<style scoped>
.demand-row :deep(.el-table__expand-icon) {
  visibility: hidden;
}
</style>
