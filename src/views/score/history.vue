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
        
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

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

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-space direction="vertical" :size="5">
              <el-button type="primary" size="small" @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button 
                v-if="row.status === 1"
                type="danger" 
                size="small" 
                @click="handleRevoke(row)"
              >
                撤销申请
              </el-button>
            </el-space>
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

    <!-- ✅ 详情弹窗 -->
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
            <el-tag type="primary" size="large">{{ selectedRecord.applyScore }} 分</el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="审核状态" :span="2">
            <el-tag :type="getStatusType(selectedRecord.status)">
              {{ getStatusText(selectedRecord.status) }}
            </el-tag>
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

        <!-- ✅ 完整审核记录 -->
        <div v-if="selectedRecord.reviewRecords && parseReviewRecords(selectedRecord.reviewRecords).length > 0" class="mt-4">
          <el-divider content-position="left">完整审核记录</el-divider>
          <el-timeline>
            <el-timeline-item 
              v-for="(review, index) in parseReviewRecords(selectedRecord.reviewRecords)" 
              :key="index"
              :type="getReviewTimelineType(review.action)"
              :color="getReviewColor(review.action)"
            >
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold">{{ review.reviewerName }}</span>
                  <el-tag :type="getReviewTagType(review.action)" size="small">
                    {{ getActionText(review.action) }}
                  </el-tag>
                </div>
                <div class="text-sm text-gray-600">
                  {{ review.comment }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatDateTime(review.timestamp) }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showDialog = false">关闭</el-button>
          <el-button 
            v-if="selectedRecord?.status === 1"
            type="danger" 
            @click="handleRevokeFromDetail"
          >
            撤销申请
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ✅ 撤销原因弹窗 -->
    <el-dialog 
      v-model="revokeDialogVisible" 
      title="撤销申请" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="撤销原因" required>
          <el-input
            v-model="revokeReason"
            type="textarea"
            :rows="4"
            placeholder="请输入撤销原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="revokeDialogVisible = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="confirmRevoke"
            :loading="revoking"
          >
            确认撤销
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getAuditHistoryPaged, 
  revokeRecord, 
  type AuditRecord,
  type ProofFileItem
} from '@/api/components/apiScore'
import FileUtil from '@/components/fileUtil.vue'

// ==================== 基础状态 ====================
const loading = ref(false)
const searchStudentId = ref('')
const searchStudentName = ref('')
const searchMajor = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 数据
const historyRecords = ref<AuditRecord[]>([])

// ✅ 详情弹窗状态
const showDialog = ref(false)
const selectedRecord = ref<AuditRecord | null>(null)

// ✅ 详情弹窗中的证明文件列表（新格式）
const detailProofFiles = ref<ProofFileItem[]>([])

// ✅ 撤销相关状态
const revokeDialogVisible = ref(false)
const revokeReason = ref('')
const revoking = ref(false)
let currentRevokeRecord: AuditRecord | null = null

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
    
    // ✅ 旧格式返回空数组
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
    return typeof files[0] === 'string'
  } catch {
    return false
  }
}

// ==================== 查看详情 ====================
const handleViewDetail = (row: AuditRecord) => {
  selectedRecord.value = { ...row }
  
  // ✅ 解析证明文件为新格式
  detailProofFiles.value = parseProofFiles(row.proofFiles || '')
  
  showDialog.value = true
}

// ==================== 数据加载 ====================
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

// ==================== 撤销相关 ====================
const handleRevoke = async (row: AuditRecord) => {
  if (row.status !== 1) {
    ElMessage.warning('只能撤销已通过的申请')
    return
  }
  
  currentRevokeRecord = row
  revokeReason.value = ''
  revokeDialogVisible.value = true
}

const handleRevokeFromDetail = () => {
  if (selectedRecord.value) {
    handleRevoke(selectedRecord.value)
  }
}

const confirmRevoke = async () => {
  if (!currentRevokeRecord) return
  
  if (!revokeReason.value.trim()) {
    ElMessage.warning('请输入撤销原因')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '撤销后将从学生信息中扣除对应分数，确定要撤销吗？',
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    revoking.value = true
    const response = await revokeRecord({
      recordId: currentRevokeRecord.id,
      reason: revokeReason.value.trim()
    })
    
    if (response.code === 200) {
      ElMessage.success('撤销成功')
      revokeDialogVisible.value = false
      showDialog.value = false
      await loadData()
    } else {
      ElMessage.error(response.msg || '撤销失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销失败:', error)
      ElMessage.error('撤销失败')
    }
  } finally {
    revoking.value = false
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

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回',
    4: '已撤销'
  }
  return map[status] || '未知'
}

const getStatusType = (status: number) => {
  const map: Record<number, any> = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    4: 'info'
  }
  return map[status] || 'info'
}

const getReviewTimelineType = (action: string) => {
  const map: Record<string, string> = {
    'approved': 'success',
    'rejected': 'danger',
    'revoked': 'info'
  }
  return map[action] || 'info'
}

const getReviewColor = (action: string) => {
  const map: Record<string, string> = {
    'approved': '#67C23A',
    'rejected': '#F56C6C',
    'revoked': '#909399'
  }
  return map[action] || '#909399'
}

const getReviewTagType = (action: string) => {
  const map: Record<string, any> = {
    'approved': 'success',
    'rejected': 'danger',
    'revoked': 'info'
  }
  return map[action] || 'info'
}

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    'approved': '审核通过',
    'rejected': '审核驳回',
    'revoked': '撤销申请'
  }
  return map[action] || '未知操作'
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
})
</script>