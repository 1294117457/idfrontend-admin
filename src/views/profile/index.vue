<template>
  <div class="admin-page flex flex-col gap-5">
    <div v-if="loading" class="flex justify-center items-center h-96">
      <el-icon class="is-loading" :size="50"><Loading /></el-icon>
    </div>

    <template v-else>
      <el-card>
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-[20px] font-bold text-gray-800">用户基本信息</h4>
          <el-button type="primary" @click="showUserEditDialog">修改用户信息</el-button>
        </div>

        <div class="flex flex-col md:flex-row gap-6">
          <el-avatar :size="84" :src="userInfo?.avatar || defaultAvatar" class="border-2 border-gray-200">
            <el-icon :size="36"><User /></el-icon>
          </el-avatar>

          <el-descriptions :column="2" border class="flex-1">
            <el-descriptions-item label="用户ID">{{ userInfo?.userId }}</el-descriptions-item>
            <el-descriptions-item label="邮箱（账号）">{{ userInfo?.username }}</el-descriptions-item>
            <el-descriptions-item label="显示名称">
              {{ userInfo?.fullName || userInfo?.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">{{ userInfo?.phone || '未设置' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

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

    <el-dialog v-model="userEditDialogVisible" title="修改用户信息" width="500px" :close-on-click-modal="false">
      <el-form :model="userEditForm" label-width="100px">
        <el-form-item label="头像">
          <div class="flex items-center gap-4">
            <el-avatar :size="64" :src="avatarPreviewUrl || defaultAvatar">
              <el-icon :size="30"><User /></el-icon>
            </el-avatar>
            <el-upload
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="handleAvatarUpload"
              accept="image/*"
            >
              <el-button size="small" type="primary" :loading="uploadingAvatar">
                {{ uploadingAvatar ? '上传中...' : '更换头像' }}
              </el-button>
            </el-upload>
          </div>
          <div class="text-xs text-gray-400 mt-2">支持 JPG、PNG 格式，大小不超过 2MB</div>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="userEditForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="userEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateUserInfo" :loading="updatingUser">确定修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="修改学生信息" width="600px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.fullName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="editForm.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="editForm.grade" placeholder="请选择年级" style="width: 100%">
            <el-option v-for="opt in gradeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="毕业年份">
          <el-input-number v-model="editForm.graduationYear" :min="2000" :max="2035" />
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
import type { UploadRequestOptions } from 'element-plus'
import { Loading, User } from '@element-plus/icons-vue'
import {
  updateUserBasicInfo,
  uploadAvatar,
  type UserInfoVO,
} from '@/api/modules/apiUser'
import {
  bindStudentInfo,
  updateStudentInfo,
  type StudentDTO,
} from '@/api/modules/apiStudent'
import { useUserStore } from '@/stores/profile'
import defaultAvatar from '@/assets/images/avatar.png'

const userStore = useUserStore()
const loading = ref(true)
const submitting = ref(false)
const updatingUser = ref(false)
const uploadingAvatar = ref(false)
const userInfo = ref<UserInfoVO | null>(null)
const editDialogVisible = ref(false)
const userEditDialogVisible = ref(false)
const avatarPreviewUrl = ref('')

const gradeOptions = [
  { label: '大一', value: 1 },
  { label: '大二', value: 2 },
  { label: '大三', value: 3 },
  { label: '大四', value: 4 },
  { label: '大五（五年制）', value: 5 },
]

const getGradeText = (grade?: number) => {
  if (!grade) return '-'
  const gradeMap: Record<number, string> = { 1: '大一', 2: '大二', 3: '大三', 4: '大四', 5: '大五' }
  return gradeMap[grade] || `年级${grade}`
}

const userEditForm = ref({
  avatar: '',
  phone: '',
})

const bindForm = ref<StudentDTO>({
  fullName: '',
  major: '',
  grade: 1,
  graduationYear: new Date().getFullYear() + 4,
})

const editForm = ref<StudentDTO>({
  fullName: '',
  major: '',
  grade: 1,
  graduationYear: new Date().getFullYear() + 1,
})

const fetchUserInfo = async () => {
  loading.value = true
  try {
    const success = await userStore.fetchUserData()
    userInfo.value = success ? userStore.userInfo : null
  } catch {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const showUserEditDialog = () => {
  userEditForm.value = {
    avatar: userInfo.value?.avatar || '',
    phone: userInfo.value?.phone || '',
  }
  avatarPreviewUrl.value = userInfo.value?.avatar || ''
  userEditDialogVisible.value = true
}

const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarUpload = async (options: UploadRequestOptions) => {
  uploadingAvatar.value = true
  try {
    const response = await uploadAvatar(options.file as File)
    if (response.code === 200) {
      userEditForm.value.avatar = response.data
      avatarPreviewUrl.value = response.data
      userStore.updateUserInfo({ avatar: response.data })
      if (userInfo.value) {
        userInfo.value.avatar = response.data
      }
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(response.msg || '头像上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '头像上传失败')
  } finally {
    uploadingAvatar.value = false
  }
}

const updateUserInfo = async () => {
  if (userEditForm.value.phone && !/^1[3-9]\d{9}$/.test(userEditForm.value.phone)) {
    ElMessage.warning('请输入正确的手机号格式')
    return
  }

  updatingUser.value = true
  try {
    const response = await updateUserBasicInfo({
      phone: userEditForm.value.phone || undefined,
      avatar: userEditForm.value.avatar || undefined,
    })
    if (response.code === 200) {
      ElMessage.success('用户信息更新成功')
      userEditDialogVisible.value = false
      userStore.updateUserInfo({
        phone: userEditForm.value.phone,
        avatar: userEditForm.value.avatar,
      })
      await fetchUserInfo()
    } else {
      ElMessage.error(response.msg || '更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '更新失败')
  } finally {
    updatingUser.value = false
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
      grade: userInfo.value.grade || 1,
      graduationYear: userInfo.value.graduationYear || new Date().getFullYear() + 1,
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
  background: linear-gradient(to bottom, #eff6ff 0%, #ffffff 100%);
}
</style>
