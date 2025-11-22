<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <el-card>
      <div class="flex items-center">
        <h4 class="text-[20px] font-bold text-gray-800">综合评价审核</h4>
      </div>
      
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="审核历史" name="history" />
      </el-tabs>

      <!-- 搜索区域 -->
      <el-row justify="space-between" align="bottom" class="filter mb-4">
        <el-row align="bottom" :gutter="20" style="width: 85%">
          <el-col :span="5">
            <label class="text-sm">学号</label>
            <el-input v-model="searchStudentId" placeholder="搜索学号" clearable />
          </el-col>
          <el-col :span="5">
            <label class="text-sm mb-1">学生姓名</label>
            <el-input v-model="searchStudentName" placeholder="搜索姓名" clearable />
          </el-col>
          <el-col :span="5" v-if="activeTab === 'history'">
            <label class="text-sm mb-1">审核状态</label>
            <el-select
              v-model="searchStatus"
              placeholder="选择状态"
              clearable
              style="width: 100%"
            >
              <el-option value="approved" label="已通过" />
              <el-option value="rejected" label="已拒绝" />
            </el-select>
          </el-col>
          <el-row class="mt-4">
            <el-button type="primary" @click="handleFilter">筛选</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-row>
        </el-row>
      </el-row>

      <!-- 表格部分 -->
      <el-table
        v-loading="loading"
        class="mt-5"
        :data="applications"
        table-layout="auto"
        border
        stripe
        :header-cell-style="{ background: '#eef1f6', color: '#606266' }"
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        
        <el-table-column prop="studentName" label="姓名" width="100" align="center" />
        
        <!-- ✅ GPA -->
        <el-table-column prop="gpa" label="GPA" width="80" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.gpa }}</span>
          </template>
        </el-table-column>

        <!-- ✅ 百分制成绩 -->
        <el-table-column prop="academicScore" label="百分制" width="90" align="center">
          <template #default="{ row }">
            {{ row.academicScore }}
          </template>
        </el-table-column>

        <el-table-column prop="foreignLanguageLevel" label="外语水平" width="150" align="center" show-overflow-tooltip />

        <el-table-column label="违纪" width="60" align="center">
          <template #default="{ row }">
            {{ row.disciplinaryViolations }}
          </template>
        </el-table-column>

        <el-table-column label="挂科" width="60" align="center">
          <template #default="{ row }">
            {{ row.failedCourses }}
          </template>
        </el-table-column>

        <!-- ✅ 去掉推免预测列 -->

        <el-table-column prop="applicationReason" label="申请说明" min-width="200" show-overflow-tooltip />

        <el-table-column prop="createdAt" label="提交时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column v-if="activeTab === 'history'" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column v-if="activeTab === 'history'" prop="reviewerName" label="审批人" width="100" align="center" />

        <el-table-column v-if="activeTab === 'history'" prop="reviewedAt" label="审批时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.reviewedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="activeTab === 'pending'"
              type="primary" 
              size="small" 
              @click="handleViewDetail(row)"
            >
              处理
            </el-button>
            <el-button 
              v-else
              type="info" 
              size="small" 
              @click="handleViewDetail(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-row justify="end" align="middle" class="mt-5">
        <el-pagination
          class="flex justify-end"
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 15, 20, 25, 30]"
          :total="totalItems"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </el-row>
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog 
      v-model="showDialog" 
      title="审核综合评价申请" 
      width="800px" 
      :close-on-click-modal="false"
    >
      <div v-if="selectedRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">
            {{ selectedRecord.studentId }}
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ selectedRecord.studentName }}
          </el-descriptions-item>
          <!-- ✅ GPA -->
          <el-descriptions-item label="绩点 (GPA)">
            <span class="font-bold">{{ selectedRecord.gpa }}</span>
          </el-descriptions-item>
          <!-- ✅ 换算后成绩 -->
          <el-descriptions-item label="百分制成绩">
            <span class="font-bold">{{ selectedRecord.academicScore }}</span>
            <span class="text-xs text-gray-500 ml-2">(由GPA自动换算)</span>
          </el-descriptions-item>
          <el-descriptions-item label="外语水平" :span="2">
            {{ selectedRecord.foreignLanguageLevel }}
          </el-descriptions-item>
          <el-descriptions-item label="违纪次数">
            {{ selectedRecord.disciplinaryViolations }}
          </el-descriptions-item>
          <el-descriptions-item label="挂科次数">
            {{ selectedRecord.failedCourses }}
          </el-descriptions-item>
          
          <!-- ✅ 去掉推免预测显示 -->
          
          <el-descriptions-item label="特殊技能" :span="2">
            {{ selectedRecord.specialSkillsRemark || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="申请说明" :span="2">
            {{ selectedRecord.applicationReason }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">
            {{ formatDateTime(selectedRecord.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 支撑材料 -->
        <div v-if="selectedRecord.attachmentFiles && selectedRecord.attachmentFiles.length > 0" class="mt-4">
          <el-divider content-position="left">支撑材料</el-divider>
          <div class="grid grid-cols-5 gap-4">
            <div 
              v-for="file in selectedRecord.attachmentFiles" 
              :key="file.objectName"
              class="border rounded p-2 hover:shadow-lg transition cursor-pointer"
              @click="handlePreviewFile(file)"
            >
              <el-image
                v-if="isImageFile(file.fileType)"
                :src="file.fileUrl"
                fit="cover"
                class="w-full h-20 rounded"
              />
              <div v-else class="w-full h-20 flex items-center justify-center bg-gray-100 rounded">
                <el-icon :size="30" color="#909399"><Document /></el-icon>
              </div>
              <div class="text-xs mt-2 text-center truncate" :title="file.fileName">
                {{ file.fileName }}
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录展示审批结果 -->
        <div v-if="activeTab === 'history'">
          <el-divider content-position="left">审批信息</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="审批状态">
              <el-tag :type="getStatusType(selectedRecord.status)">
                {{ getStatusText(selectedRecord.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审批人">
              {{ selectedRecord.reviewerName }}
            </el-descriptions-item>
            <el-descriptions-item label="审批时间" :span="2">
              {{ formatDateTime(selectedRecord.reviewedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">
              {{ selectedRecord.reviewComment }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 待审核记录显示审核表单 -->
        <div v-if="activeTab === 'pending'" class="mt-4">
          <el-divider content-position="left">审核操作</el-divider>
          <el-form label-width="100px">
            <el-form-item label="审批建议">
              <el-radio-group v-model="reviewAction">
                <el-radio value="approved">
                  <span class="text-green-600 font-bold">通过</span>
                </el-radio>
                <el-radio value="rejected">
                  <span class="text-red-600 font-bold">拒绝</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="审批意见">
              <el-input
                v-model="reviewComment"
                type="textarea"
                :placeholder="reviewAction === 'approved' ? '审核通过(可选)' : '请输入拒绝理由'"
                :rows="3"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showDialog = false">关闭</el-button>
          <template v-if="activeTab === 'pending'">
            <el-button 
              type="primary" 
              @click="handleSubmitReview"
              :loading="submitting"
            >
              提交审批
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import {
  getApplicationList,
  reviewApplication,
  type EvaluationApplication,
  type EvaluationQueryParams
} from '@/api/components/apiEvaluation'

// 搜索相关
const searchStudentId = ref('')
const searchStudentName = ref('')
const searchStatus = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const loading = ref(false)

// 标签页
const activeTab = ref('pending')

// 数据
const applications = ref<EvaluationApplication[]>([])

// 审核弹窗
const showDialog = ref(false)
const selectedRecord = ref<EvaluationApplication | null>(null)
const reviewAction = ref('approved')
const reviewComment = ref('')
const submitting = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: EvaluationQueryParams = {
      studentId: searchStudentId.value || undefined,
      studentName: searchStudentName.value || undefined,
      status: activeTab.value === 'pending' ? 'pending' : searchStatus.value || undefined,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    const response = await getApplicationList(params)
    
    if (response.code === 200) {
      applications.value = response.data.list || []
      totalItems.value = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '加载失败')
    }
  } catch (error: any) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 标签页切换
const handleTabChange = () => {
  currentPage.value = 1
  handleReset()
}

// 筛选
const handleFilter = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchStudentId.value = ''
  searchStudentName.value = ''
  searchStatus.value = ''
  currentPage.value = 1
  loadData()
}

// 分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

// 查看详情
const handleViewDetail = (row: EvaluationApplication) => {
  selectedRecord.value = { ...row }
  reviewAction.value = 'approved'
  reviewComment.value = ''
  showDialog.value = true
}

// 提交审批
const handleSubmitReview = async () => {
  if (!selectedRecord.value) return
  
  if (reviewAction.value === 'rejected' && !reviewComment.value.trim()) {
    ElMessage.warning('请输入拒绝理由')
    return
  }
  
  submitting.value = true
  try {
    const response = await reviewApplication({
      applicationId: selectedRecord.value.id,
      status: reviewAction.value,
      reviewComment: reviewComment.value || (reviewAction.value === 'approved' ? '审核通过' : '')
    })
    
    if (response.code === 200) {
      ElMessage.success('审批成功')
      showDialog.value = false
      loadData()
    } else {
      ElMessage.error(response.msg || '审批失败')
    }
  } catch (error: any) {
    console.error('审批失败:', error)
    ElMessage.error('审批失败')
  } finally {
    submitting.value = false
  }
}

// 预览文件
const handlePreviewFile = (file: any) => {
  window.open(file.fileUrl, '_blank')
}

// 判断是否为图片
const isImageFile = (fileType: string) => {
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType.toLowerCase())
}

// 格式化时间
const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '-'
  try {
    return new Date(datetime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return datetime
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'pending': '待审批',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return map[status] || status
}

onMounted(() => {
  loadData()
})
</script>