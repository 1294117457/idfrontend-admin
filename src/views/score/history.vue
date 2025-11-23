<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <el-card>
      <div class="flex items-center mb-4">
        <h4 class="text-[20px] font-bold text-gray-800">审核历史</h4>
      </div>
      
      <!-- 搜索区域 -->
      <el-row justify="space-between" align="bottom" class="filter mb-4">
        <el-row align="bottom" :gutter="20" style="width: 85%">
          <el-col :span="5">
            <label>学号:</label>
            <el-input v-model="searchStudentId" placeholder="请输入学号" clearable />
          </el-col>
          <el-col :span="5">
            <label>姓名:</label>
            <el-input v-model="searchStudentName" placeholder="请输入姓名" clearable />
          </el-col>
          <el-col :span="5">
            <label>专业:</label>
            <el-input v-model="searchMajor" placeholder="请输入专业" clearable />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleFilter">筛选</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </el-row>

      <!-- 表格部分 -->
      <el-table
        v-loading="loading"
        class="mt-5"
        :data="historyRecords"
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
        <el-table-column prop="major" label="专业" width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="templateName" label="加分项名称" width="150" align="center" />
        
        <!-- 审核状态 -->
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 审核进度 -->
        <el-table-column label="审核进度" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.currentReviewCount / row.reviewCount) * 100"
              :format="() => `${row.currentReviewCount}/${row.reviewCount}`"
            />
          </template>
        </el-table-column>

        <!-- ✅ 使用 applyScore -->
        <el-table-column prop="applyScore" label="申请得分" width="100" align="center" />
        <el-table-column prop="submitTime" label="提交时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="showDialog" 
      title="审核详情" 
      width="800px" 
      :close-on-click-modal="false"
    >
      <div v-if="selectedRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ selectedRecord.studentId }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedRecord.studentName }}</el-descriptions-item>
          <el-descriptions-item label="专业" :span="2">{{ selectedRecord.major }}</el-descriptions-item>
          <el-descriptions-item label="加分项">{{ selectedRecord.templateName }}</el-descriptions-item>
          <el-descriptions-item label="申请得分">
            <span class="text-lg font-bold text-red-500">{{ selectedRecord.applyScore }}分</span>
          </el-descriptions-item>
          
          <el-descriptions-item label="审核状态">
            <el-tag :type="getStatusType(selectedRecord.status)">
              {{ getStatusText(selectedRecord.status) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="审核进度">
            <el-progress 
              :percentage="(selectedRecord.currentReviewCount / selectedRecord.reviewCount) * 100"
              :format="() => `${selectedRecord.currentReviewCount}/${selectedRecord.reviewCount} 人已审核`"
            />
          </el-descriptions-item>

          <el-descriptions-item label="规则填写值" :span="2">
            {{ formatRuleValues(selectedRecord.ruleValues) }}
          </el-descriptions-item>

          <el-descriptions-item label="备注" :span="2" v-if="selectedRecord.remark">
            {{ selectedRecord.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- ✅ 使用 FileUtil 组件预览证明文件 -->
        <div v-if="selectedRecord.proofFiles && parseProofFiles(selectedRecord.proofFiles).length > 0" class="mt-4">
          <el-divider content-position="left">证明文件</el-divider>
          <FileUtil
            v-model="previewFileList"
            :show-upload-button="false"
            :show-file-list="true"
            :show-preview-button="true"
            :show-delete-button="false"
            :show-download-in-dialog="true"
            :disabled="true"
            :icon-size="20"
            upload-text=""
            :show-tip="false"
            :get-file-url="handleGetFileUrl"
          />
        </div>

        <!-- 完整审核记录 -->
        <div v-if="selectedRecord.reviewRecords && parseReviewRecords(selectedRecord.reviewRecords).length > 0" class="mt-4">
          <el-divider content-position="left">完整审核记录</el-divider>
          <el-timeline>
            <el-timeline-item 
              v-for="(review, index) in parseReviewRecords(selectedRecord.reviewRecords)" 
              :key="index"
              :timestamp="review.timestamp"
              :type="review.action === 'approved' ? 'success' : 'danger'"
            >
              <el-card>
                <template #header>
                  <div class="flex justify-between items-center">
                    <span class="font-bold">{{ review.reviewerName }}</span>
                    <el-tag :type="review.action === 'approved' ? 'success' : 'danger'" size="small">
                      {{ review.action === 'approved' ? '通过' : '驳回' }}
                    </el-tag>
                  </div>
                </template>
                <p class="text-gray-700">{{ review.comment }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="showDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAuditHistoryPaged, getFileUrl } from '@/api/components/apiExamine'
// ✅ 导入 FileUtil 组件
import FileUtil from '@/components/fileUtil.vue'

// ✅ 文件预览列表
const previewFileList = ref<UploadUserFile[]>([])

// ✅ 获取文件URL
const handleGetFileUrl = async (fileUrl: string, type: number) => {
  try {
    const response = await getFileUrl(fileUrl, type)
    console.log('✅ 获取文件URL响应:', response)
    return response
  } catch (error) {
    console.error('❌ 获取文件链接失败:', error)
    throw error
  }
}

// ✅ 修改 handleViewDetail 函数
const handleViewDetail = (row: any) => {
  selectedRecord.value = { ...row }
  
  // ✅ 将证明文件转换为 UploadUserFile 格式
  const files = parseProofFiles(row.proofFiles)
  previewFileList.value = files.map((url: string, index: number) => ({
    name: `证明文件${index + 1}.${getFileExtFromUrl(url)}`,
    url: url,
    uid: Date.now() + index,
    status: 'success' as const
  }))
  
  showDialog.value = true
}

// ✅ 从 URL 中提取文件扩展名
const getFileExtFromUrl = (url: string): string => {
  try {
    const parts = url.split('.')
    return parts[parts.length - 1] || 'file'
  } catch {
    return 'file'
  }
}
// 搜索相关
const searchStudentId = ref('')
const searchStudentName = ref('')
const searchMajor = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const loading = ref(false)

// 数据
const historyRecords = ref<any[]>([])

// 详情弹窗
const showDialog = ref(false)
const selectedRecord = ref<any>(null)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getAuditHistoryPaged(
      currentPage.value, 
      pageSize.value,
      searchStudentId.value || undefined,
      searchStudentName.value || undefined,
      searchMajor.value || undefined
    )
    if (response.code === 200) {
      historyRecords.value = response.data.records || []
      totalItems.value = response.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchStudentId.value = ''
  searchStudentName.value = ''
  searchMajor.value = ''
  currentPage.value = 1
  loadData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}



// ✅ 使用 ruleValues
const formatRuleValues = (json: string) => {
  if (!json) return '-'
  try {
    const obj = JSON.parse(json)
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  } catch {
    return json
  }
}

const parseProofFiles = (json: string) => {
  if (!json) return []
  try {
    const files = JSON.parse(json)
    return Array.isArray(files) ? files : []
  } catch {
    return []
  }
}

// ✅ 修改函数名: parseAuditRecords → parseReviewRecords
const parseReviewRecords = (json: string) => {
  if (!json) return []
  try {
    const records = JSON.parse(json)
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

const formatDateTime = (datetime: string) => {
  if (!datetime) return '-'
  try {
    return new Date(datetime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return datetime
  }
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回'
  }
  return map[status] || '未知'
}

const getStatusType = (status: number) => {
  const map: Record<number, any> = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  loadData()
})
</script>