<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 操作栏 -->
    <el-card>
      <el-button type="primary" @click="handleAdd">新增权限</el-button>
    </el-card>

    <!-- 权限列表 -->
    <el-card>
      <el-table :data="permissionList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="permissionCode" label="权限编码" width="200" />
        
        <el-table-column prop="permissionName" label="权限名称" width="150" />
        
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag :type="getModuleTagType(row.module)" size="small">
              {{ row.module }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" />
        
        <el-table-column label="排序" width="80">
          <template #default="{ row }">
            {{ row.sortOrder }}
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑权限弹窗 -->
    <el-dialog 
      v-model="formDialogVisible" 
      :title="isEdit ? '编辑权限' : '新增权限'" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="permForm" label-width="100px">
        <el-form-item label="权限编码" required>
          <el-input 
            v-model="permForm.permissionCode" 
            placeholder="格式: module:action (如 user:view)"
            :disabled="isEdit"
          />
          <div class="text-xs text-gray-500 mt-1">
            格式说明: 模块:操作 (如 user:view, role:create)
          </div>
        </el-form-item>
        
        <el-form-item label="权限名称" required>
          <el-input 
            v-model="permForm.permissionName" 
            placeholder="请输入权限名称"
          />
        </el-form-item>
        
        <el-form-item label="所属模块" required>
          <el-select 
            v-model="permForm.module" 
            placeholder="请选择模块"
            style="width: 100%"
          >
            <el-option label="用户管理" value="user" />
            <el-option label="角色管理" value="role" />
            <el-option label="权限管理" value="permission" />
            <el-option label="学生管理" value="student" />
            <el-option label="文件管理" value="file" />
            <el-option label="系统管理" value="system" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="permForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number 
            v-model="permForm.sortOrder" 
            :min="0" 
            :max="999"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="permForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission,
  type PermissionPO,
  type PermissionDTO
} from '@/api/components/apiRBAC'

// ==================== 数据 ====================
const permissionList = ref<PermissionPO[]>([])
const loading = ref(false)
const formDialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const permForm = reactive<PermissionDTO>({
  permissionCode: '',
  permissionName: '',
  module: '',
  description: '',
  sortOrder: 0,
  status: 1
})

// ==================== 加载权限列表 ====================
const loadPermissions = async () => {
  loading.value = true
  try {
    const response = await getPermissionList()
    if (response.code === 200) {
      permissionList.value = response.data || []
      console.log('✅ 权限列表:', permissionList.value)
    } else {
      ElMessage.error(response.msg || '加载失败')
    }
  } catch (error) {
    console.error('❌ 加载权限失败:', error)
    ElMessage.error('加载权限失败')
  } finally {
    loading.value = false
  }
}

// ==================== 新增权限 ====================
const handleAdd = () => {
  isEdit.value = false
  Object.assign(permForm, {
    id: undefined,
    permissionCode: '',
    permissionName: '',
    module: '',
    description: '',
    sortOrder: 0,
    status: 1
  })
  formDialogVisible.value = true
}

// ==================== 编辑权限 ====================
const handleEdit = (row: PermissionPO) => {
  isEdit.value = true
  Object.assign(permForm, {
    id: row.id,
    permissionCode: row.permissionCode,
    permissionName: row.permissionName,
    module: row.module,
    description: row.description,
    sortOrder: row.sortOrder,
    status: row.status
  })
  formDialogVisible.value = true
}

// ==================== 保存（新增/编辑）====================
const confirmSave = async () => {
  // 1. 表单验证
  if (!permForm.permissionCode || !permForm.permissionName || !permForm.module) {
    ElMessage.warning('请填写完整的权限信息')
    return
  }

  // 2. 权限编码格式验证
  const codePattern = /^[a-z_]+:[a-z_]+$/
  if (!codePattern.test(permForm.permissionCode)) {
    ElMessage.warning('权限编码格式不正确，应为 module:action 格式')
    return
  }

  // 3. 检查权限编码与模块是否一致
  const codeModule = permForm.permissionCode.split(':')[0]
  if (codeModule !== permForm.module) {
    ElMessage.warning(`权限编码中的模块 '${codeModule}' 与所选模块 '${permForm.module}' 不一致`)
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      // 编辑
      const response = await updatePermission(permForm)
      if (response.code === 200) {
        ElMessage.success('更新成功')
        formDialogVisible.value = false
        await loadPermissions()
      } else {
        ElMessage.error(response.msg || '更新失败')
      }
    } else {
      // 新增
      const response = await createPermission(permForm)
      if (response.code === 200) {
        ElMessage.success('创建成功')
        formDialogVisible.value = false
        await loadPermissions()
      } else {
        ElMessage.error(response.msg || '创建失败')
      }
    }
  } catch (error: any) {
    console.error('❌ 保存失败:', error)
    ElMessage.error(error.response?.data?.msg || '操作失败')
  } finally {
    saving.value = false
  }
}

// ==================== 删除权限 ====================
const handleDelete = async (row: PermissionPO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${row.permissionName}" 吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    const response = await deletePermission(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadPermissions()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除失败:', error)
      ElMessage.error(error.response?.data?.msg || '删除失败')
    }
  }
}

// ==================== 辅助函数 ====================
const getModuleTagType = (module: string) => {
  const typeMap: Record<string, any> = {
    'user': 'primary',
    'role': 'success',
    'permission': 'warning',
    'student': 'info',
    'file': '',
    'system': 'danger'
  }
  return typeMap[module] || 'info'
}

// ==================== 初始化 ====================
onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.el-button + .el-button {
  margin-left: 10px;
}

.text-xs {
  font-size: 0.75rem;
}

.text-gray-500 {
  color: #6b7280;
}

.mt-1 {
  margin-top: 0.25rem;
}
</style>