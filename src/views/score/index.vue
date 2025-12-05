<template>
  <div class="min-h-screen flex flex-col gap-5 p-4">
    <el-card>
      <div class="flex items-center">
        <h4 class="text-[20px] font-bold text-gray-800">分数审核</h4>
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
        :data="pendingRecords"
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
        
        <el-table-column label="审核进度" width="120" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.currentReviewCount / row.reviewCount) * 100"
              :format="() => `${row.currentReviewCount}/${row.reviewCount}`"
            />
          </template>
        </el-table-column>

        <el-table-column prop="applyScore" label="申请得分" width="100" align="center" />
        <el-table-column prop="submitTime" label="提交时间" min-width="160" align="center">
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

    <!-- 审核弹窗 -->
    <el-dialog 
      v-model="showDialog" 
      title="审核加分项申请" 
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
          
          <el-descriptions-item label="审核进度" :span="2">
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

        <!-- ✅ 使用新的 FileUtil 组件预览证明文件 -->
        <div v-if="detailProofFiles.length > 0" class="mt-4">
          <el-divider content-position="left">证明文件</el-divider>
          <FileUtil
            v-model="detailProofFiles"
            :show-upload-button="false"
            :show-preview-button="true"
            :show-download-button="true"
            :show-delete-button="false"
            :disabled="true"
          />
        </div>
        
        <!-- ✅ 兼容旧数据提示 -->
        <div v-else-if="selectedRecord.proofFiles && hasOldFormatFiles(selectedRecord.proofFiles)" class="mt-4">
          <el-divider content-position="left">证明文件</el-divider>
          <el-alert 
            type="warning" 
            :closable="false"
            title="旧数据格式，暂不支持在线预览"
            description="此申请使用旧的文件存储格式，如需查看请联系管理员"
          />
        </div>

        <!-- 审核历史 -->
        <div v-if="selectedRecord.reviewRecords && parseReviewRecords(selectedRecord.reviewRecords).length > 0" class="mt-4">
          <el-divider content-position="left">审核历史</el-divider>
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

        <!-- 当前用户审核操作 -->
        <div class="mt-4">
          <el-divider content-position="left">我的审核意见</el-divider>
          <el-form-item label="审核意见">
            <el-input 
              v-model="auditComment" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入审核意见"
            />
          </el-form-item>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showDialog = false">关闭</el-button>
          <el-button type="success" @click="handleApprove">通过</el-button>
          <el-button type="danger" @click="handleReject">驳回</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  approveRecord, 
  rejectRecord,
  getPendingRecordsPaged,
  type AuditRecord,
  type ProofFileItem
} from '@/api/components/apiScore'
import FileUtil from '@/components/fileUtil.vue'

// ==================== 搜索相关 ====================
const searchStudentId = ref('')
const searchStudentName = ref('')
const searchMajor = ref('')

// ==================== 分页相关 ====================
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const loading = ref(false)

// ==================== 数据 ====================
const pendingRecords = ref<AuditRecord[]>([])

// ==================== 审核弹窗 ====================
const showDialog = ref(false)
const selectedRecord = ref<AuditRecord | null>(null)
const auditComment = ref('')

// ✅ 详情弹窗中的证明文件列表（新格式：[{fileId, fileName}]）
const detailProofFiles = ref<ProofFileItem[]>([])

// ==================== ✅ 解析证明文件（支持新旧格式） ====================
const parseProofFiles = (json: string): ProofFileItem[] => {
  if (!json) return []
  try {
    const files = JSON.parse(json)
    if (!Array.isArray(files)) return []
    
    // ✅ 检查是否为新格式 [{fileId, fileName}]
    if (files.length > 0 && typeof files[0] === 'object' && files[0].fileId !== undefined) {
      return files as ProofFileItem[]
    }
    
    // ✅ 旧格式（字符串数组）返回空，由 hasOldFormatFiles 处理提示
    return []
  } catch {
    return []
  }
}

// ✅ 检查是否有旧格式文件
const hasOldFormatFiles = (json: string): boolean => {
  if (!json) return false
  try {
    const files = JSON.parse(json)
    if (!Array.isArray(files) || files.length === 0) return false
    
    // 如果第一个元素是字符串，说明是旧格式
    return typeof files[0] === 'string'
  } catch {
    return false
  }
}

// ✅ 修改 handleViewDetail 函数
const handleViewDetail = (row: AuditRecord) => {
  selectedRecord.value = { ...row }
  auditComment.value = ''
  
  // ✅ 解析证明文件为新格式
  detailProofFiles.value = parseProofFiles(row.proofFiles || '')
  
  showDialog.value = true
}

// ==================== 数据加载 ====================
const loadData = async () => {
  loading.value = true
  try {
    const response = await getPendingRecordsPaged(
      currentPage.value, 
      pageSize.value,
      searchStudentId.value || undefined,
      searchStudentName.value || undefined,
      searchMajor.value || undefined
    )
    
    if (response.code === 200) {
      pendingRecords.value = response.data.records || []
      totalItems.value = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '加载数据失败')
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

// ==================== 审核操作 ====================
const handleApprove = async () => {
  if (!selectedRecord.value) return
  
  try {
    const response = await approveRecord({
      recordId: selectedRecord.value.id,
      comment: auditComment.value || '审核通过'
    })
    
    if (response.code === 200) {
      ElMessage.success(response.msg || '审核通过')
      showDialog.value = false
      loadData()
    } else {
      ElMessage.error(response.msg || '审核失败')
    }
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  }
}

const handleReject = async () => {
  if (!selectedRecord.value) return
  
  if (!auditComment.value.trim()) {
    ElMessage.warning('请输入驳回理由')
    return
  }
  
  try {
    const response = await rejectRecord({
      recordId: selectedRecord.value.id,
      comment: auditComment.value
    })
    
    if (response.code === 200) {
      ElMessage.success(response.msg || '已驳回')
      showDialog.value = false
      loadData()
    } else {
      ElMessage.error(response.msg || '驳回失败')
    }
  } catch (error) {
    console.error('驳回失败:', error)
    ElMessage.error('驳回失败')
  }
}

// ==================== 辅助函数 ====================
const formatRuleValues = (json: string | undefined) => {
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

const parseReviewRecords = (json: string | undefined) => {
  if (!json) return []
  try {
    const records = JSON.parse(json)
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

const formatDateTime = (datetime: string | undefined) => {
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

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})
</script>