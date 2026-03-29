<!-- filepath: idfrontend-admin/src/views/account-manage/index.vue -->
<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 搜索表单 -->
    <el-card>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="queryForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="queryForm.fullName" placeholder="请输入姓名" clearable />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <!-- ✅ 新增用户按钮 -->
          <el-button type="success" @click="handleAdd">新增用户</el-button>
          <el-button type="primary" plain @click="handleBatchImport">批量导入</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card>
      <el-table :data="userList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
        
        <el-table-column prop="username" label="用户名（学校邮箱）" min-width="200" />

        <el-table-column label="学生信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row.fullName">
              <div class="text-sm text-gray-600">
                {{ row.fullName }} - {{ row.major }}
              </div>
              <div v-if="row.grade" class="text-xs text-gray-500 mt-1">
                <el-tag :type="getGradeTagType(row.grade)" size="small">
                  {{ getGradeLabel(row.grade) }}
                </el-tag>
              </div>
            </div>
            <span v-else class="text-gray-400">未绑定</span>
          </template>
        </el-table-column>
        
        <el-table-column label="账号状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="270" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleManageRoles(row)">
              角色管理
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
              :disabled="isSuperAdmin(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <!-- ✅ 删除按钮 -->
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="isSuperAdmin(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalItems"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- ✅ 新增用户弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增用户"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="addForm.username" placeholder="请输入用户名（邮箱或任意字符串）" />
        </el-form-item>
        
        <el-form-item label="密码" required>
          <el-input
            v-model="addForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="角色" required>
          <el-select v-model="addForm.role" placeholder="请选择角色" class="w-full">
            <el-option label="管理员" value="admin" />
            <el-option label="审核员" value="reviewer" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmAdd">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 角色管理弹窗 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="角色管理"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser">
        <p class="mb-4">用户: <strong>{{ currentUser.username }}</strong></p>
        <div v-loading="loadingRoles">
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox
              v-for="role in allRoles"
              :key="role.id"
              :label="role.id"
              :disabled="role.roleCode === 'super_admin'"
            >
              {{ role.roleName }}
              <span v-if="role.description" class="text-gray-500 text-xs ml-1">({{ role.description }})</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmAssignRoles">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="batchImportDialogVisible"
      title="批量导入用户"
      width="600px"
      :close-on-click-modal="false"
    >
      <p class="text-gray-500 mb-3 text-sm">上传 XLS/XLSX 文件，第一列为邮箱（账号），初始密码统一为 <strong>123456</strong>，角色为普通用户。</p>
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept=".xls,.xlsx"
        drag
      >
        <div class="py-6">
          <div class="text-gray-400 text-sm">拖拽文件到此处，或 <span class="text-blue-500">点击上传</span></div>
          <div class="text-gray-400 text-xs mt-1">仅支持 .xls / .xlsx 格式</div>
        </div>
      </el-upload>

      <div v-if="previewUsernames.length > 0" class="mt-4">
        <p class="text-sm font-medium mb-2">预览（共 {{ previewUsernames.length }} 条）：</p>
        <div class="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto text-sm text-gray-700">
          <div v-for="(name, idx) in previewUsernames.slice(0, 10)" :key="idx">{{ name }}</div>
          <div v-if="previewUsernames.length > 10" class="text-gray-400">... 共 {{ previewUsernames.length }} 条</div>
        </div>
      </div>

      <div v-if="batchResult" class="mt-4">
        <el-alert
          :title="`导入完成：成功 ${batchResult.successCount} 条，跳过 ${batchResult.failedCount} 条`"
          :type="batchResult.failedCount > 0 ? 'warning' : 'success'"
          show-icon
          :closable="false"
        />
        <div v-if="batchResult.failed.length > 0" class="mt-2 text-xs text-gray-500 max-h-24 overflow-y-auto">
          <div v-for="f in batchResult.failed" :key="f">{{ f }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeBatchImport">取消</el-button>
        <el-button
          type="primary"
          :loading="batchImporting"
          :disabled="previewUsernames.length === 0"
          @click="confirmBatchImport"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { getRoleList, type RolePO } from '@/api/components/apiRBAC'
import {
  getUserListForAdmin,
  getUserRoles,
  assignUserRoles,
  updateUserStatus,
  createUser,
  deleteUser,
  batchCreateUsers,
  type UserManageVO,
  type UserDTO
} from '@/api/components/apiUser'

// 查询表单
const queryForm = reactive({
  username: '',
  fullName: ''
})

// 新增用户表单
const addForm = reactive<UserDTO>({
  username: '',
  password: '',
  phone: '',
  role: 'admin'
})

// 用户列表
const userList = ref<UserManageVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 弹窗状态
const addDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const currentUser = ref<UserManageVO | null>(null)
const allRoles = ref<RolePO[]>([])
const selectedRoleIds = ref<number[]>([])
const loadingRoles = ref(false)
const saving = ref(false)

// 序号计算
const indexMethod = (index: number) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// ==================== 加载用户列表 ====================
const loadUsers = async () => {
  loading.value = true
  try {
    console.log('✅ 查询参数:', {
      ...queryForm,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })

    const response = await getUserListForAdmin({
      username: queryForm.username || undefined,
      fullName: queryForm.fullName || undefined,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })

    if (response.code === 200) {
      userList.value = response.data.list || []
      totalItems.value = response.data.total || 0
      
      console.log('✅ 用户列表加载成功:', {
        当前页: currentPage.value,
        每页条数: pageSize.value,
        总条数: totalItems.value,
        当前页数据量: userList.value.length
      })
    } else {
      ElMessage.error(response.msg || '加载失败')
    }
  } catch (error) {
    console.error('❌ 加载用户失败:', error)
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

// ==================== 加载所有角色 ====================
const loadAllRoles = async () => {
  try {
    const response = await getRoleList()
    if (response.code === 200) {
      allRoles.value = response.data || []
    }
  } catch (error) {
    console.error('加载角色失败:', error)
  }
}

// ==================== 查询/重置 ====================
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleReset = () => {
  queryForm.username = ''
  queryForm.fullName = ''
  currentPage.value = 1
  loadUsers()
}

// ==================== ✅ 新增用户 ====================
const handleAdd = () => {
  Object.assign(addForm, {
    username: '',
    password: '',
    phone: '',
    role: 'admin'
  })
  addDialogVisible.value = true
}

const confirmAdd = async () => {
  if (!addForm.username || !addForm.password) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (addForm.password.length < 6) {
    ElMessage.warning('密码长度至少6位')
    return
  }

  saving.value = true
  try {
    const response = await createUser(addForm)
    if (response.code === 200) {
      ElMessage.success('创建成功')
      addDialogVisible.value = false
      await loadUsers()
    } else {
      ElMessage.error(response.msg || '创建失败')
    }
  } catch (error: any) {
    console.error('❌ 创建用户失败:', error)
    ElMessage.error(error.response?.data?.msg || '创建失败')
  } finally {
    saving.value = false
  }
}

// ==================== ✅ 禁用/启用用户 ====================
const handleToggleStatus = async (user: UserManageVO) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'inactive' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const response = await updateUserStatus(user.userId, newStatus)
    if (response.code === 200) {
      ElMessage.success(`${action}成功`)
      await loadUsers()
    } else {
      ElMessage.error(response.msg || `${action}失败`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(`❌ ${action}用户失败:`, error)
      ElMessage.error(error.response?.data?.msg || `${action}失败`)
    }
  }
}

// ==================== ✅ 删除用户 ====================
const isSuperAdmin = (user: UserManageVO) => {
  // ✅ 根据实际的角色编码判断
  return user.role === 'super_admin'  // 或 'superAdmin'
}

const handleDelete = async (user: UserManageVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await deleteUser(user.userId)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadUsers()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除用户失败:', error)
      ElMessage.error(error.response?.data?.msg || '删除失败')
    }
  }
}

// ==================== 角色管理（保持不变）====================
const handleManageRoles = async (user: UserManageVO) => {
  currentUser.value = user
  loadingRoles.value = true
  roleDialogVisible.value = true

  try {
    const response = await getUserRoles(user.userId)
    if (response.code === 200) {
      selectedRoleIds.value = response.data.map((r: any) => r.id)
    }
  } catch (error: any) {
    console.error('❌ 获取用户角色失败:', error)
    ElMessage.error(error.response?.data?.msg || '获取角色失败')
  } finally {
    loadingRoles.value = false
  }
}

const confirmAssignRoles = async () => {
  if (!currentUser.value) return

  saving.value = true
  try {
    const response = await assignUserRoles(
      currentUser.value.userId,
      selectedRoleIds.value
    )

    if (response.code === 200) {
      ElMessage.success('角色分配成功')
      roleDialogVisible.value = false
      await loadUsers()
    } else {
      ElMessage.error(response.msg || '角色分配失败')
    }
  } catch (error: any) {
    console.error('❌ 角色分配失败:', error)
    ElMessage.error(error.response?.data?.msg || '角色分配失败')
  } finally {
    saving.value = false
  }
}

// ==================== 分页处理 ====================
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUsers()
}

// ==================== 辅助函数 ====================
const getGradeTagType = (grade: number) => {
  const typeMap: Record<number, any> = {
    1: 'success',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return typeMap[grade] || 'info'
}

const getGradeLabel = (grade: number) => {
  const gradeMap: Record<number, string> = {
    1: '大一',
    2: '大二',
    3: '大三',
    4: '大四'
  }
  return gradeMap[grade] || `年级${grade}`
}

// ==================== 批量导入 ====================
const batchImportDialogVisible = ref(false)
const previewUsernames = ref<string[]>([])
const batchImporting = ref(false)
const batchResult = ref<{ success: string[]; failed: string[]; successCount: number; failedCount: number } | null>(null)
const uploadRef = ref()

const handleBatchImport = () => {
  previewUsernames.value = []
  batchResult.value = null
  batchImportDialogVisible.value = true
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    previewUsernames.value = rows
      .map((row: any[]) => String(row[0] ?? '').trim())
      .filter((v: string) => v.length > 0)
  }
  reader.readAsArrayBuffer(file.raw)
}

const handleFileRemove = () => {
  previewUsernames.value = []
}

const confirmBatchImport = async () => {
  if (previewUsernames.value.length === 0) return
  batchImporting.value = true
  try {
    const res = await batchCreateUsers(previewUsernames.value)
    if (res.code === 200) {
      batchResult.value = res.data
      await loadUsers()
    } else {
      ElMessage.error(res.msg || '批量导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '批量导入失败')
  } finally {
    batchImporting.value = false
  }
}

const closeBatchImport = () => {
  batchImportDialogVisible.value = false
  batchResult.value = null
  previewUsernames.value = []
}

// ==================== 初始化 ====================
onMounted(() => {
  loadUsers()
  loadAllRoles()
})
</script>

<style scoped>
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.text-sm {
  font-size: 0.875rem;
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

.mb-1 {
  margin-bottom: 0.25rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-4 {
  margin-top: 1rem;
}

.font-bold {
  font-weight: bold;
}

.font-medium {
  font-weight: 500;
}
</style>