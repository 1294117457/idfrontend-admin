<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 操作栏 -->
    <el-card>
      <el-button type="primary" @click="handleAdd">新增角色</el-button>
    </el-card>

    <!-- 角色列表 -->
    <el-card>
      <el-table :data="roleList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        
        <el-table-column prop="roleName" label="角色名称" width="150" />
        
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
        
        <el-table-column label="系统角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem === 1" type="warning" size="small">
              是
            </el-tag>
            <span v-else class="text-gray-400">否</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleAssignPermissions(row)">
              分配权限
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
              :disabled="row.isSystem === 1"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog 
      v-model="formDialogVisible" 
      :title="isEdit ? '编辑角色' : '新增角色'" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="roleForm" label-width="100px">
        <el-form-item label="角色编码" required>
          <el-input 
            v-model="roleForm.roleCode" 
            placeholder="小写字母和下划线,如 content_editor"
            :disabled="isEdit"
          />
          <div class="text-xs text-gray-500 mt-1">
            只能包含小写字母和下划线,创建后不可修改
          </div>
        </el-form-item>
        
        <el-form-item label="角色名称" required>
          <el-input 
            v-model="roleForm.roleName" 
            placeholder="请输入角色名称"
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="roleForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number 
            v-model="roleForm.sortOrder" 
            :min="0" 
            :max="999"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="roleForm.status">
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

    <!-- 分配权限弹窗 -->
    <el-dialog 
      v-model="permDialogVisible" 
      title="分配权限" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentRole">
        <p class="mb-4 text-gray-600">
          角色: <span class="font-bold">{{ currentRole.roleName }}</span>
        </p>
        
        <el-tree
          ref="permTreeRef"
          :data="permTreeData"
          show-checkbox
          node-key="id"
          :default-checked-keys="selectedPermIds"
          :props="{ label: 'permissionName', children: 'children' }"
        />
      </div>
      
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmAssignPermissions">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionsToRole,
  getPermissionList,
  type RolePO,
  type RoleDTO,
  type PermissionPO
} from '@/api/components/apiRBAC'

// ==================== 角色列表 ====================
const roleList = ref<RolePO[]>([])
const loading = ref(false)

// ==================== 表单 ====================
const formDialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const roleForm = reactive<RoleDTO>({
  roleCode: '',
  roleName: '',
  description: '',
  sortOrder: 0,
  status: 1
})

// ==================== 权限分配 ====================
const permDialogVisible = ref(false)
const currentRole = ref<RolePO | null>(null)
const permTreeRef = ref<InstanceType<typeof ElTree>>()
const permTreeData = ref<any[]>([])
const selectedPermIds = ref<number[]>([])

// ==================== 加载数据 ====================
const loadRoles = async () => {
  loading.value = true
  try {
    const response = await getRoleList()
    if (response.code === 200) {
      roleList.value = response.data || []
      console.log('✅ 角色列表:', roleList.value)
    } else {
      ElMessage.error(response.msg || '加载失败')
    }
  } catch (error) {
    console.error('❌ 加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    const response = await getPermissionList()
    if (response.code === 200) {
      const permissions = response.data || []
      
      // 按模块分组
      const grouped = permissions.reduce((acc: any, perm: PermissionPO) => {
        if (!acc[perm.module]) {
          acc[perm.module] = []
        }
        acc[perm.module].push({
          id: perm.id,
          permissionName: perm.permissionName,
          permissionCode: perm.permissionCode
        })
        return acc
      }, {})
      
      // 转换为树形结构
      permTreeData.value = Object.keys(grouped).map(module => ({
        id: `module_${module}`,
        permissionName: module,
        children: grouped[module]
      }))
      
      console.log('✅ 权限树:', permTreeData.value)
    }
  } catch (error) {
    console.error('❌ 加载权限失败:', error)
  }
}

// ==================== 新增/编辑 ====================
const handleAdd = () => {
  isEdit.value = false
  Object.assign(roleForm, {
    id: undefined,
    roleCode: '',
    roleName: '',
    description: '',
    sortOrder: 0,
    status: 1
  })
  formDialogVisible.value = true
}

const handleEdit = (row: RolePO) => {
  isEdit.value = true
  Object.assign(roleForm, {
    id: row.id,
    roleCode: row.roleCode,
    roleName: row.roleName,
    description: row.description,
    sortOrder: row.sortOrder,
    status: row.status
  })
  formDialogVisible.value = true
}

const confirmSave = async () => {
  // 1. 表单验证
  if (!roleForm.roleCode || !roleForm.roleName) {
    ElMessage.warning('请填写完整的角色信息')
    return
  }

  // 2. 角色编码格式验证
  const codePattern = /^[a-z_]+$/
  if (!codePattern.test(roleForm.roleCode)) {
    ElMessage.warning('角色编码格式不正确，只能包含小写字母和下划线')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      // 编辑
      const response = await updateRole(roleForm)
      if (response.code === 200) {
        ElMessage.success('更新成功')
        formDialogVisible.value = false
        await loadRoles()
      } else {
        ElMessage.error(response.msg || '更新失败')
      }
    } else {
      // 新增
      const response = await createRole(roleForm)
      if (response.code === 200) {
        ElMessage.success('创建成功')
        formDialogVisible.value = false
        await loadRoles()
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

// ==================== 删除 ====================
const handleDelete = async (row: RolePO) => {
  if (row.isSystem === 1) {
    ElMessage.warning('系统角色不允许删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.roleName}" 吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    const response = await deleteRole(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadRoles()
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

// ==================== 分配权限 ====================
const handleAssignPermissions = async (row: RolePO) => {
  currentRole.value = row
  
  try {
    // 获取角色已有的权限
    const response = await getRolePermissions(row.id)
    if (response.code === 200) {
      selectedPermIds.value = (response.data || []).map((p: PermissionPO) => p.id)
      console.log('✅ 角色权限:', selectedPermIds.value)
    }
  } catch (error) {
    console.error('❌ 获取角色权限失败:', error)
  }
  
  permDialogVisible.value = true
}

const confirmAssignPermissions = async () => {
  if (!currentRole.value) return

  // 获取选中的权限ID（只包含叶子节点）
  const checkedKeys = permTreeRef.value?.getCheckedKeys(false) as number[]
  const selectedIds = checkedKeys.filter(id => typeof id === 'number')

  saving.value = true
  try {
    const response = await assignPermissionsToRole({
      roleId: currentRole.value.id,
      permissionIds: selectedIds
    })

    if (response.code === 200) {
      ElMessage.success('权限分配成功')
      permDialogVisible.value = false
    } else {
      ElMessage.error(response.msg || '权限分配失败')
    }
  } catch (error: any) {
    console.error('❌ 权限分配失败:', error)
    ElMessage.error(error.response?.data?.msg || '权限分配失败')
  } finally {
    saving.value = false
  }
}

// ==================== 初始化 ====================
onMounted(() => {
  loadRoles()
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

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-600 {
  color: #4b5563;
}

.font-bold {
  font-weight: bold;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>