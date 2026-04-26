<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-96">
      <el-icon class="is-loading" :size="50"><Loading /></el-icon>
    </div>

    <template v-else>
      <!-- 用户基本信息 -->
      <el-card>
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-[20px] font-bold text-gray-800">用户基本信息</h4>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ userInfo?.userId }}</el-descriptions-item>
          <el-descriptions-item label="邮箱（账号）">{{ userInfo?.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ userInfo?.phone || '未设置' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 未绑定学生信息 -->
      <el-card v-if="!userInfo?.fullName">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-[20px] font-bold text-gray-800">绑定学生信息</h4>
        </div>
        <el-form :model="bindForm" label-width="120px">
          <el-form-item label="姓名">
            <el-input v-model="bindForm.fullName" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="专业">
            <el-input v-model="bindForm.major" placeholder="请输入专业" />
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="bindForm.grade" placeholder="请选择年级" style="width: 100%">
              <el-option v-for="opt in gradeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="毕业年份">
            <el-input-number v-model="bindForm.graduationYear" :min="2000" :max="2035" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="bindStudent" :loading="submitting">绑定学生信息</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 已绑定学生信息 -->
      <el-card v-else class="student-info-card">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-[20px] font-bold text-gray-800">学生信息</h4>
          <el-button type="primary" @click="showEditDialog">修改学生信息</el-button>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ userInfo.fullName }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ userInfo.major }}</el-descriptions-item>
          <el-descriptions-item label="年级">
            <el-tag>{{ getGradeText(userInfo.grade) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="毕业年份">{{ userInfo.graduationYear }}</el-descriptions-item>
          <el-descriptions-item label="学业成绩">{{ userInfo.academicScore ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业成绩">{{ userInfo.specialtyScore ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="综合成绩">{{ userInfo.comprehensiveScore ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="GPA">{{ userInfo.gpa ?? '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="确认状态">
            <el-tag :type="userInfo.isConfirmed ? 'success' : 'warning'">
              {{ userInfo.isConfirmed ? '已确认' : '未确认' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>

    <!-- 修改学生信息弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改学生信息" width="600px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.fullName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="editForm.major" placeholder="请输入专业" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateStudent" :loading="submitting">确定修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

import {
  getUserCompleteInfo,
  type UserInfoVO
} from '@/api/modules/apiUser'

import {
  bindStudentInfo,
  updateStudentInfo,
  type StudentDTO
} from '@/api/modules/apiStudent'

const loading = ref(true)
const submitting = ref(false)
const userInfo = ref<UserInfoVO | null>(null)
const editDialogVisible = ref(false)

const gradeOptions = [
  { label: '大一', value: 1 },
  { label: '大二', value: 2 },
  { label: '大三', value: 3 },
  { label: '大四', value: 4 }
]

const getGradeText = (grade?: number) => {
  if (!grade) return '-'
  const gradeMap: Record<number, string> = { 1: '大一', 2: '大二', 3: '大三', 4: '大四' }
  return gradeMap[grade] || `年级${grade}`
}

const bindForm = ref<StudentDTO>({
  fullName: '',
  major: '',
  grade: 1,
  graduationYear: new Date().getFullYear() + 4,
})

const editForm = ref<StudentDTO>({
  fullName: '',
  major: '',
})

const fetchUserInfo = async () => {
  loading.value = true
  try {
    const response = await getUserCompleteInfo()
    if (response.code === 200) {
      userInfo.value = response.data
    } else {
      userInfo.value = null
    }
  } catch (error: any) {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const bindStudent = async () => {
  if (!bindForm.value.fullName || !bindForm.value.major) {
    ElMessage.warning('请填写姓名和专业')
    return
  }

  submitting.value = true
  try {
    const response = await bindStudentInfo(bindForm.value)
    if (response.code === 200) {
      ElMessage.success('学生信息绑定成功')
      await fetchUserInfo()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '绑定失败')
  } finally {
    submitting.value = false
  }
}

const showEditDialog = () => {
  if (userInfo.value) {
    editForm.value = {
      fullName: userInfo.value.fullName || '',
      major: userInfo.value.major || '',
    }
  }
  editDialogVisible.value = true
}

const updateStudent = async () => {
  if (!editForm.value.fullName || !editForm.value.major) {
    ElMessage.warning('请填写姓名和专业')
    return
  }

  submitting.value = true
  try {
    const response = await updateStudentInfo(editForm.value)
    if (response.code === 200) {
      ElMessage.success('学生信息更新成功')
      editDialogVisible.value = false
      await fetchUserInfo()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '更新失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.student-info-card {
  background: linear-gradient(to bottom, #e3f2fd 0%, #ffffff 100%);
}
</style>
