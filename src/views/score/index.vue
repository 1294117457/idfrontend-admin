<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { 
    getPendingRecordsPaged,
    approveRecord,
    rejectRecord,
    revokeRecord,
    getFilePreviewById,
    downloadFileById,
    getApplicationProofs,  // ✅ 新增
    approveProof,          // ✅ 新增
    rejectProof,           // ✅ 新增
    type AuditRecord
  } from '@/api/components/apiScore'
  import FileUtil from '@/components/FileUtil.vue'
  
  // ==================== 状态管理 ====================
  const loading = ref(false)
  const showDialog = ref(false)
  const selectedRecord = ref<AuditRecord | null>(null)
  const pendingRecords = ref<AuditRecord[]>([])
  const detailProofFiles = ref<any[]>([])
  
  // ✅ 新增: 证明材料列表
  const proofsList = ref<any[]>([])
  const proofsLoading = ref(false)
  
  // 分页
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalItems = ref(0)
  
  // 搜索条件
  const searchStudentId = ref('')
  const searchStudentName = ref('')
  const searchMajor = ref('')
  
  // ==================== ✅ 加载证明材料列表 ====================
  const loadProofs = async (applicationId: number) => {
  try {
    proofsLoading.value = true
    const response = await getApplicationProofs(applicationId)
    
    if (response.code === 200) {
      proofsList.value = response.data.proofs || []
      console.log('✅ 加载证明材料成功:', proofsList.value)
    } else {
      ElMessage.error('加载证明材料失败: ' + response.msg)
    }
  } catch (error) {
    console.error('❌ 加载证明材料失败:', error)
    ElMessage.error('加载证明材料失败')
  } finally {
    proofsLoading.value = false
  }
}
  
  // ==================== ✅ 审核证明材料 ====================
  const handleApproveProof = async (proofId: number) => {
  try {
    const { value: comment } = await ElMessageBox.prompt('审核意见 (选填)', '审核证明材料', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      inputType: 'textarea'
    })

    const response = await approveProof(proofId, comment || '')
    
    if (response.code === 200) {
      ElMessage.success('证明材料审核通过')
      await loadProofs(selectedRecord.value!.id)
    } else {
      ElMessage.error(response.msg || '审核失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 审核失败:', error)
      ElMessage.error('审核失败')
    }
  }
}
  
  const handleRejectProof = async (proofId: number) => {
  try {
    const { value: comment } = await ElMessageBox.prompt('驳回原因 (必填)', '驳回证明材料', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValidator: (value) => !!value,
      inputErrorMessage: '请输入驳回原因'
    })

    const response = await rejectProof(proofId, comment || '')
    
    if (response.code === 200) {
      ElMessage.success('证明材料已驳回')
      await loadProofs(selectedRecord.value!.id)
    } else {
      ElMessage.error(response.msg || '驳回失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 驳回失败:', error)
      ElMessage.error('驳回失败')
    }
  }
}
  
  // ==================== 加载待审核记录 ====================
  const loadPendingRecords = async () => {
    loading.value = true
    try {
      const response = await getPendingRecordsPaged(
        currentPage.value,
        pageSize.value,
        searchStudentId.value,
        searchStudentName.value,
        searchMajor.value
      )
  
      if (response.code === 200) {
        pendingRecords.value = response.data.records
        totalItems.value = response.data.total
      } else {
        ElMessage.error('加载失败')
      }
    } catch (error) {
      console.error('加载失败:', error)
      ElMessage.error('加载失败')
    } finally {
      loading.value = false
    }
  }
  
  // ==================== ✅ 查看详情 (加载证明材料) ====================
  const handleViewDetail = async (row: AuditRecord) => {
    selectedRecord.value = { ...row }
    showDialog.value = true
    
    // ✅ 加载证明材料列表
    await loadProofs(row.id)
    
    // 处理文件列表 (兼容旧格式)
    if (row.proofFiles) {
      try {
        const files = JSON.parse(row.proofFiles)
        if (Array.isArray(files) && files.length > 0 && typeof files[0] === 'object') {
          detailProofFiles.value = files.map(f => ({
            fileId: f.fileId,
            fileName: f.fileName
          }))
        } else {
          detailProofFiles.value = []
        }
      } catch {
        detailProofFiles.value = []
      }
    }
  }
  
  // ==================== ✅ 审核申请 (新增 TRANSFORM 校验) ====================
  const handleApprove = async () => {
    if (!selectedRecord.value) return
  
    try {
      // ✅ TRANSFORM 模板校验
      if (selectedRecord.value.templateType === 'TRANSFORM') {
        const allProofsApproved = proofsList.value.every(p => p.status === 1)
        if (!allProofsApproved) {
          ElMessage.warning('请先审核通过所有证明材料')
          return
        }
  
        const proofsInput = proofsList.value
          .filter(p => p.status === 1)
          .reduce((sum, p) => sum + Number(p.proofValue || 0), 0)
        
        const applyInput = Number(selectedRecord.value.applyInput || 0)
        
        if (Math.abs(proofsInput - applyInput) > 0.01) {
          ElMessage.error(`证明材料总值 ${proofsInput} 与申请输入值 ${applyInput} 不符，无法通过`)
          return
        }
      }
  
      const { value: comment } = await ElMessageBox.prompt('审核意见 (选填)', '审核通过', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea'
      })
  
      const response = await approveRecord({
        recordId: selectedRecord.value.id,
        comment: comment || ''
      })
  
      if (response.code === 200) {
        ElMessage.success('审核通过')
        showDialog.value = false
        loadPendingRecords()
      } else {
        ElMessage.error(response.msg || '审核失败')
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('审核失败:', error)
        ElMessage.error('审核失败')
      }
    }
  }
  
  const handleReject = async () => {
    if (!selectedRecord.value) return
  
    try {
      const { value: comment } = await ElMessageBox.prompt('驳回原因 (必填)', '审核驳回', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => !!value,
        inputErrorMessage: '请输入驳回原因'
      })
  
      const response = await rejectRecord({
        recordId: selectedRecord.value.id,
        comment: comment || ''
      })
  
      if (response.code === 200) {
        ElMessage.success('已驳回')
        showDialog.value = false
        loadPendingRecords()
      } else {
        ElMessage.error(response.msg || '驳回失败')
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('驳回失败:', error)
        ElMessage.error('驳回失败')
      }
    }
  }
  
  // ==================== 筛选和分页 ====================
  const handleFilter = () => {
    currentPage.value = 1
    loadPendingRecords()
  }
  
  const handleReset = () => {
    searchStudentId.value = ''
    searchStudentName.value = ''
    searchMajor.value = ''
    currentPage.value = 1
    loadPendingRecords()
  }
  
  const handlePageChange = (page: number) => {
    currentPage.value = page
    loadPendingRecords()
  }
  
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadPendingRecords()
  }
  
  // ==================== 辅助函数 ====================
  const formatDateTime = (datetime: string) => {
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
  
  const formatRuleValues = (json: string) => {
    if (!json) return '-'
    try {
      const obj = JSON.parse(json)
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
    } catch {
      return json
    }
  }
  
  const parseReviewRecords = (json: string) => {
    if (!json) return []
    try {
      const records = JSON.parse(json)
      return Array.isArray(records) ? records : []
    } catch {
      return []
    }
  }
  
  const hasOldFormatFiles = (files: string) => {
    try {
      const parsed = JSON.parse(files)
      return Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string'
    } catch {
      return false
    }
  }
  
  const getProofStatusType = (status: number) => {
    const map: Record<number, any> = { 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] || 'info'
  }
  
  const getProofStatusText = (status: number) => {
    const map: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已驳回' }
    return map[status] || '未知'
  }
  
  // ✅ 预览/下载证明材料
  const handlePreviewProof = async (fileId: number) => {
    try {
      const response = await getFilePreviewById(fileId, 60)
      if (response.code === 200) {
        window.open(response.data, '_blank')
      } else {
        ElMessage.error('获取预览链接失败')
      }
    } catch (error) {
      console.error('预览失败:', error)
      ElMessage.error('预览失败')
    }
  }
  
  const handleDownloadProof = async (fileId: number, fileName: string) => {
    try {
      await downloadFileById(fileId, fileName)
      ElMessage.success('下载成功')
    } catch (error) {
      console.error('下载失败:', error)
      ElMessage.error('下载失败')
    }
  }
  
  // ==================== 生命周期 ====================
  onMounted(() => {
    loadPendingRecords()
  })
  </script>
  
  <template>
    <div class="min-h-screen flex flex-col gap-5 p-4">
      <el-card>
        <div class="flex items-center">
          <h4 class="text-[20px] font-bold text-gray-800">分数审核</h4>
        </div>
        
        <!-- 搜索区域 (保持不变) -->
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
  
        <!-- 表格部分 (保持不变) -->
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
        
        <!-- 分页组件 (保持不变) -->
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
  
      <!-- ========== ✅ 审核弹窗 (新增证明材料审核) ========== -->
      <el-dialog 
        v-model="showDialog" 
        title="审核加分项申请" 
        width="1000px" 
        :close-on-click-modal="false"
      >
        <div v-if="selectedRecord">
          <!-- 基本信息 -->
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学号">{{ selectedRecord.studentId }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ selectedRecord.studentName }}</el-descriptions-item>
            <el-descriptions-item label="专业" :span="2">{{ selectedRecord.major }}</el-descriptions-item>
            <el-descriptions-item label="加分项">{{ selectedRecord.templateName }}</el-descriptions-item>
            <el-descriptions-item label="模板类型">
              <el-tag :type="selectedRecord.templateType === 'CONDITION' ? 'success' : 'warning'">
                {{ selectedRecord.templateType === 'CONDITION' ? '条件匹配' : '分数换算' }}
              </el-tag>
            </el-descriptions-item>
            
            <!-- ✅ TRANSFORM 模板显示输入值 -->
            <el-descriptions-item v-if="selectedRecord.templateType === 'TRANSFORM'" label="申请输入值">
              <span class="text-lg font-bold text-blue-500">{{ selectedRecord.applyInput }}</span>
            </el-descriptions-item>
            
            <el-descriptions-item label="申请得分">
              <span class="text-lg font-bold text-red-500">{{ selectedRecord.applyScore }}分</span>
            </el-descriptions-item>
            
            <el-descriptions-item label="审核进度" :span="2">
              <el-progress 
                :percentage="(selectedRecord.currentReviewCount / selectedRecord.reviewCount) * 100"
                :format="() => `${selectedRecord.currentReviewCount}/${selectedRecord.reviewCount} 人已审核`"
              />
            </el-descriptions-item>
  
            <el-descriptions-item v-if="selectedRecord.remark" label="备注" :span="2">
              {{ selectedRecord.remark }}
            </el-descriptions-item>
          </el-descriptions>
  
          <!-- ========== ✅ 证明材料列表 (新增审核功能) ========== -->
          <div class="mt-4">
            <el-divider content-position="left">证明材料 (需逐个审核)</el-divider>
            
            <el-table 
              v-loading="proofsLoading"
              :data="proofsList" 
              border 
              stripe
              max-height="400"
            >
              <el-table-column type="index" label="序号" width="60" align="center" />
              
              <el-table-column label="文件名" min-width="200">
                <template #default="{ row }">
                  <div class="flex items-center gap-2">
                    <el-tag type="info" size="small">文件</el-tag>
                    <span>文件ID: {{ row.proofFileId }}</span>
                  </div>
                </template>
              </el-table-column>
  
              <el-table-column label="证明值" width="100" align="center">
                <template #default="{ row }">
                  <span class="font-semibold text-blue-600">{{ row.proofValue }}</span>
                </template>
              </el-table-column>
  
              <el-table-column label="审核进度" width="120" align="center">
                <template #default="{ row }">
                  {{ row.approvedCount }} / {{ row.reviewCount }}
                </template>
              </el-table-column>
  
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getProofStatusType(row.status)">
                    {{ getProofStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
  
              <el-table-column label="操作" width="250" align="center" fixed="right">
                <template #default="{ row }">
                  <div class="flex justify-center gap-2">
                    <el-button
                      size="small"
                      type="primary"
                      link
                      @click="handlePreviewProof(row.proofFileId)"
                    >
                      预览
                    </el-button>
                    
                    <el-button
                      size="small"
                      type="success"
                      link
                      @click="handleDownloadProof(row.proofFileId, row.fileName || `文件${row.proofFileId}`)"
                    >
                      下载
                    </el-button>
                    
                    <el-button
                      v-if="row.status === 0"
                      size="small"
                      type="success"
                      @click="handleApproveProof(row.id)"
                    >
                      通过
                    </el-button>
                    
                    <el-button
                      v-if="row.status === 0"
                      size="small"
                      type="danger"
                      @click="handleRejectProof(row.id)"
                    >
                      驳回
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
  
            <!-- ✅ TRANSFORM 模板显示累加值 -->
            <div v-if="selectedRecord.templateType === 'TRANSFORM'" class="mt-3">
              <el-alert
                :title="`证明材料总值: ${proofsList.filter(p => p.status === 1).reduce((sum, p) => sum + Number(p.proofValue || 0), 0)} (需等于申请输入值 ${selectedRecord.applyInput})`"
                :type="Math.abs(proofsList.filter(p => p.status === 1).reduce((sum, p) => sum + Number(p.proofValue || 0), 0) - Number(selectedRecord.applyInput || 0)) < 0.01 ? 'success' : 'warning'"
                :closable="false"
              />
            </div>
          </div>
  
          <!-- ✅ 兼容旧数据 -->
          <div v-if="detailProofFiles.length > 0" class="mt-4">
            <el-divider content-position="left">旧版文件 (仅查看)</el-divider>
            <FileUtil
              v-model="detailProofFiles"
              :show-upload-button="false"
              :disabled="true"
            />
          </div>
  
          <!-- 审核历史 -->
          <div v-if="selectedRecord.reviewRecords && parseReviewRecords(selectedRecord.reviewRecords).length > 0" class="mt-4">
            <el-divider content-position="left">审核历史</el-divider>
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in parseReviewRecords(selectedRecord.reviewRecords)"
                :key="index"
                :timestamp="formatDateTime(record.timestamp)"
                placement="top"
              >
                <div>
                  <el-tag :type="record.action === 'approved' ? 'success' : 'danger'" size="small">
                    {{ record.action === 'approved' ? '通过' : '驳回' }}
                  </el-tag>
                  <span class="ml-2">审核人: {{ record.reviewerName }}</span>
                  <p v-if="record.comment" class="mt-1 text-gray-600">{{ record.comment }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
  
        <template #footer>
          <div class="flex justify-between">
            <div>
              <el-button @click="showDialog = false">关闭</el-button>
            </div>
            <div>
              <el-button type="danger" @click="handleReject">驳回</el-button>
              <el-button type="success" @click="handleApprove">通过</el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <style scoped>
  .filter {
    margin-top: 20px;
  }
  </style>