<!-- filepath: idfrontend-admin/src/views/account-manage/role.vue -->
<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 操作栏 -->
    <el-card>
      <el-button type="primary" @click="handleAdd">新增角色</el-button>
    </el-card>

    <!-- 角色列表 -->
    <el-card>
      <el-table :data="roleList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="系统内置" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem === 1" type="info">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleAssignPermissions(row)">
              分配权限
            </el-button>
            <el-button
              link
              type="danger"
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
      width="500px"
    >
      <el-form :model="roleForm" label-width="100px">
        <el-form-item label="角色编码" required>
          <el-input
            v-model="roleForm.roleCode"
            placeholder="例如: admin"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.roleName" placeholder="例如: 管理员" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="角色描述"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="roleForm.sortOrder" :min="0" />
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
        <el-button type="primary" @click="confirmSave" :loading="saving">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配权限弹窗 -->
    <el-dialog v-model="permDialogVisible" title="分配权限" width="600px">
      <el-form>
        <el-form-item label="角色">
          <el-input :value="currentRole?.roleName" disabled />
        </el-form-item>
        <el-form-item label="选择权限">
          <el-tree
            ref="permTreeRef"
            :data="permTreeData"
            show-checkbox
            node-key="id"
            :default-checked-keys="selectedPermIds"
            :props="{ children: 'children', label: 'permissionName' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignPermissions" :loading="saving">
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
  // ✅ 添加角色管理 API
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionsToRole,
  // ✅ 权限管理 API
  getPermissionList,
  createPermission,
  deletePermission,
  // ✅ 类型定义
  type RolePO,
  type RoleDTO,
  type PermissionPO,
  type PermissionDTO
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
    roleList.value = response.data || []
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    const response = await getPermissionList()
    const permissions = response.data || []

    // 按模块分组
    const moduleMap = new Map<string, PermissionPO[]>()
    permissions.forEach(perm => {
      const module = perm.module || '其他'
      if (!moduleMap.has(module)) {
        moduleMap.set(module, [])
      }
      moduleMap.get(module)!.push(perm)
    })

    // 转为树形结构
    permTreeData.value = Array.from(moduleMap.entries()).map(([module, perms], index) => ({
      id: `module_${index}`,
      permissionName: module,
      children: perms
    }))
  } catch (error) {
    console.error('加载权限失败:', error)
  }
}

// ==================== 新增/编辑 ====================
const handleAdd = () => {
  isEdit.value = false
  Object.assign(roleForm, {
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
  if (!roleForm.roleCode || !roleForm.roleName) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await updateRole(roleForm)
      ElMessage.success('更新成功')
    } else {
      await createRole(roleForm)
      ElMessage.success('创建成功')
    }
    formDialogVisible.value = false
    await loadRoles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '操作失败')
  } finally {
    saving.value = false
  }
}

// ==================== 删除 ====================
const handleDelete = async (row: RolePO) => {
  try {
    await ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗？`, '提示', {
      type: 'warning'
    })

    await deleteRole(row.id)
    ElMessage.success('删除成功')
    await loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.msg || '删除失败')
    }
  }
}

// ==================== 分配权限 ====================
const handleAssignPermissions = async (row: RolePO) => {
  currentRole.value = row
  try {
    const response = await getRolePermissions(row.id)
    selectedPermIds.value = (response.data || []).map(p => p.id)
    permDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载角色权限失败')
  }
}

const confirmAssignPermissions = async () => {
  if (!currentRole.value) return

  const checkedKeys = permTreeRef.value?.getCheckedKeys(false) as number[]
  const permIds = checkedKeys.filter(key => typeof key === 'number')

  saving.value = true
  try {
    await assignPermissionsToRole({
      roleId: currentRole.value.id,
      permissionIds: permIds
    })

    ElMessage.success('权限分配成功')
    permDialogVisible.value = false
  } catch (error: any) {
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