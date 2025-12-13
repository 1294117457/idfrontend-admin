<!-- filepath: idfrontend-admin/src/views/account-manage/permission.vue -->
<template>
    <div class="min-h-screen flex flex-col gap-5 p-4">
      <!-- 操作栏 -->
      <el-card>
        <el-button type="primary" @click="handleAdd">新增权限</el-button>
      </el-card>
  
      <!-- 权限列表 -->
      <el-card>
        <el-table :data="permissionList" v-loading="loading" border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="permissionCode" label="权限编码" width="200" />
          <el-table-column prop="permissionName" label="权限名称" width="150" />
          <el-table-column prop="module" label="所属模块" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 新增权限弹窗 -->
      <el-dialog v-model="formDialogVisible" title="新增权限" width="500px">
        <el-form :model="permForm" label-width="100px">
          <el-form-item label="权限编码" required>
            <el-input v-model="permForm.permissionCode" placeholder="例如: user:view" />
          </el-form-item>
          <el-form-item label="权限名称" required>
            <el-input v-model="permForm.permissionName" placeholder="例如: 查看用户" />
          </el-form-item>
          <el-form-item label="所属模块">
            <el-input v-model="permForm.module" placeholder="例如: user" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="permForm.description"
              type="textarea"
              :rows="3"
              placeholder="权限描述"
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="permForm.sortOrder" :min="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSave" :loading="saving">
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
  type RolePO,      // ✅ 从 apiRBAC 导入
  type RoleDTO,     // ✅ 从 apiRBAC 导入
  type PermissionPO // ✅ 从 apiRBAC 导入
} from '@/api/components/apiRBAC'
  
  const permissionList = ref<PermissionPO[]>([])
  const loading = ref(false)
  const formDialogVisible = ref(false)
  const saving = ref(false)
  
  const permForm = reactive<PermissionDTO>({
    permissionCode: '',
    permissionName: '',
    module: '',
    description: '',
    sortOrder: 0,
    status: 1
  })
  
  const loadPermissions = async () => {
    loading.value = true
    try {
      const response = await getPermissionList()
      permissionList.value = response.data || []
    } catch (error) {
      ElMessage.error('加载权限失败')
    } finally {
      loading.value = false
    }
  }
  
  const handleAdd = () => {
    Object.assign(permForm, {
      permissionCode: '',
      permissionName: '',
      module: '',
      description: '',
      sortOrder: 0,
      status: 1
    })
    formDialogVisible.value = true
  }
  
  const confirmSave = async () => {
    if (!permForm.permissionCode || !permForm.permissionName) {
      ElMessage.warning('请填写必填项')
      return
    }
  
    saving.value = true
    try {
      await createPermission(permForm)
      ElMessage.success('创建成功')
      formDialogVisible.value = false
      await loadPermissions()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.msg || '创建失败')
    } finally {
      saving.value = false
    }
  }
  
  const handleDelete = async (row: PermissionPO) => {
    try {
      await ElMessageBox.confirm(`确定删除权限 "${row.permissionName}" 吗？`, '提示', {
        type: 'warning'
      })
  
      await deletePermission(row.id)
      ElMessage.success('删除成功')
      await loadPermissions()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.response?.data?.msg || '删除失败')
      }
    }
  }
  
  onMounted(() => {
    loadPermissions()
  })
  </script>