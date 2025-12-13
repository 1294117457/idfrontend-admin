<!-- filepath: idfrontend-admin/src/views/account-manage/index.vue -->
<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 查询表单 -->
    <el-card>
      <el-form :inline="true">
        <el-form-item label="用户名">
          <el-input v-model="queryForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="queryForm.email" placeholder="请输入邮箱" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card>
      <el-table :data="userList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="角色" width="300">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              :type="getRoleTagType(role.roleCode)"
              class="mr-2"
            >
              {{ role.roleName }}
            </el-tag>
            <el-tag v-if="!row.roles || row.roles.length === 0" type="info">无角色</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录时间" width="180" />
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleAssignRoles(row)">
              分配角色
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalItems"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="mt-4"
      />
    </el-card>

    <!-- 用户角色分配弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="500px">
      <el-form>
        <el-form-item label="用户">
          <el-input :value="currentUser?.username" disabled />
        </el-form-item>
        <el-form-item label="选择角色">
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox
              v-for="role in allRoles"
              :key="role.id"
              :label="role.id"
              :disabled="role.roleCode === 'super_admin' && !isSuperAdmin"
            >
              {{ role.roleName }} <span class="text-gray-400">({{ role.roleCode }})</span>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignRoles" :loading="saving">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getRoleList, 
  getUserRoles, 
  assignRolesToUser,
  type RolePO  // ✅ 从 apiRBAC 导入类型
} from '@/api/components/apiRBAC'
// ==================== 查询表单 ====================
const queryForm = reactive({
  username: '',
  email: ''
})

// ==================== 用户列表 ====================
interface UserWithRoles {
  id: number
  username: string
  email: string
  lastLoginAt?: string
  roles?: RolePO[]
}

const userList = ref<UserWithRoles[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// ==================== 角色分配 ====================
const roleDialogVisible = ref(false)
const currentUser = ref<UserWithRoles | null>(null)
const allRoles = ref<RolePO[]>([])
const selectedRoleIds = ref<number[]>([])
const saving = ref(false)
const isSuperAdmin = ref(false) // 是否为超级管理员

// ==================== 加载数据 ====================
const loadUsers = async () => {
  loading.value = true
  try {
    // TODO: 调用你的用户列表接口
    // const response = await getUserList(queryForm, currentPage.value, pageSize.value)
    // userList.value = response.data.list
    // totalItems.value = response.data.total

    // 示例数据
    userList.value = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        lastLoginAt: '2025-01-15 10:30:00',
        roles: []
      },
      {
        id: 4,
        username: 'zchzch22',
        email: '2446484919@qq.com',
        lastLoginAt: '2025-12-13 10:03:05',
        roles: []
      }
    ]
    totalItems.value = 2

    // 加载每个用户的角色
    for (const user of userList.value) {
      const rolesRes = await getUserRoles(user.id)
      user.roles = rolesRes.data || []
    }
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

const loadAllRoles = async () => {
  try {
    const response = await getRoleList()
    allRoles.value = response.data || []
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
  queryForm.email = ''
  currentPage.value = 1
  loadUsers()
}

// ==================== 分配角色 ====================
const handleAssignRoles = async (user: UserWithRoles) => {
  currentUser.value = user
  selectedRoleIds.value = user.roles?.map(r => r.id) || []
  roleDialogVisible.value = true
}

const confirmAssignRoles = async () => {
  if (!currentUser.value) return

  saving.value = true
  try {
    await assignRolesToUser({
      userId: currentUser.value.id,
      roleIds: selectedRoleIds.value
    })

    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '角色分配失败')
  } finally {
    saving.value = false
  }
}

// ==================== 分页 ====================
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
const getRoleTagType = (roleCode: string) => {
  const typeMap: Record<string, any> = {
    super_admin: 'danger',
    admin: 'warning',
    reviewer: 'success',
    user: 'info'
  }
  return typeMap[roleCode] || 'info'
}

// ==================== 初始化 ====================
onMounted(() => {
  loadUsers()
  loadAllRoles()

  // TODO: 检查当前用户是否为超级管理员
  // isSuperAdmin.value = checkIfSuperAdmin()
})
</script>

<style scoped>
.mr-2 {
  margin-right: 8px;
}
</style>