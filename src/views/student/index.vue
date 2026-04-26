<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  // ✅ 确认导入正确
  import { getStudentDataList, type StudentDataItem, type StudentQueryParams } from '@/api/modules/apiStudent'
  import { getStudentExportFields } from '@/api/modules/apiUser'
  import * as XLSX from 'xlsx'

  // 搜索相关
  const searchFullName = ref('')
  const searchMajor = ref('')
  const searchGrade = ref<number | undefined>(undefined)  // ✅ 年级筛选

  // 分页相关
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalItems = ref(0)
  const loading = ref(false)
  const exporting = ref(false)

  // 数据
  const students = ref<StudentDataItem[]>([])

  // 详情弹窗
  const showDialog = ref(false)
  const selectedStudent = ref<StudentDataItem | null>(null)

  // 导出相关
  const exportDialogVisible = ref(false)
  const exportFields = ref<{ key: string; label: string }[]>([])
  const selectedExportFields = ref<string[]>([])

  const loadExportFields = async () => {
    if (exportFields.value.length > 0) return
    try {
      const res = await getStudentExportFields()
      if (res.code === 200) {
        exportFields.value = res.data
        selectedExportFields.value = res.data.map((f: { key: string }) => f.key)
      }
    } catch (e) {
      console.error('获取导出字段失败:', e)
    }
  }

  const openExportDialog = async () => {
    await loadExportFields()
    exportDialogVisible.value = true
  }

  const gradeOptions = [
    { label: '大一', value: 1 },
    { label: '大二', value: 2 },
    { label: '大三', value: 3 },
    { label: '大四', value: 4 },
    { label: '大五（五年制）', value: 5 },
  ]

  const getGradeTagType = (grade: number | undefined | null): string => {
    if (grade === undefined || grade === null) return 'info'
    if (grade === 1) return 'success'
    if (grade === 2) return 'primary'
    if (grade === 3) return 'warning'
    if (grade >= 4) return 'danger'
    return 'info'
  }

  const getGradeLabel = (grade: number | undefined | null): string => {
    if (grade === undefined || grade === null) return '-'
    const gradeMap: Record<number, string> = {
      1: '大一', 2: '大二', 3: '大三', 4: '大四', 5: '大五'
    }
    return gradeMap[grade] || `年级${grade}`
  }

  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      const params: StudentQueryParams = {
        fullName: searchFullName.value || undefined,
        major: searchMajor.value || undefined,
        grade: searchGrade.value,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }

      const response = await getStudentDataList(params)

      if (response.code === 200) {
        students.value = response.data.list
        totalItems.value = response.data.total
      } else {
        ElMessage.error(response.msg || '加载失败')
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    } finally {
      loading.value = false
    }
  }

  // 拉取当前筛选条件下的全量数据
  const fetchAllData = async (): Promise<StudentDataItem[]> => {
    const params: StudentQueryParams = {
      fullName: searchFullName.value || undefined,
      major: searchMajor.value || undefined,
      grade: searchGrade.value,
      pageNum: 1,
      pageSize: 9999
    }
    const response = await getStudentDataList(params)
    return response.code === 200 ? response.data.list : []
  }

  // 筛选
  const handleFilter = () => {
    currentPage.value = 1
    loadData()
  }

  // 重置
  const handleReset = () => {
    searchFullName.value = ''
    searchMajor.value = ''
    searchGrade.value = undefined
    currentPage.value = 1
    loadData()
  }

  // 查看详情
  const viewDetail = (row: StudentDataItem) => {
    selectedStudent.value = row
    showDialog.value = true
  }

  // 格式化单个字段值
  const formatFieldValue = (item: StudentDataItem, key: string): string | number | boolean => {
    const val = (item as any)[key]
    if (key === 'grade') return getGradeLabel(val)
    if (key === 'isConfirmed') return val ? '已确认' : '未确认'
    if (typeof val === 'number' && !Number.isInteger(val)) return parseFloat(val.toFixed(2))
    return val ?? '-'
  }

  // 确认导出
  const confirmExport = async () => {
    if (selectedExportFields.value.length === 0) {
      ElMessage.warning('请至少选择一个导出字段')
      return
    }
    exportDialogVisible.value = false
    exporting.value = true
    try {
      const allData = await fetchAllData()
      if (allData.length === 0) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const headers = exportFields.value
        .filter(f => selectedExportFields.value.includes(f.key))
      const rows = allData.map(item => {
        const row: Record<string, any> = {}
        headers.forEach(f => { row[f.label] = formatFieldValue(item, f.key) })
        return row
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '学生数据')
      XLSX.writeFile(wb, `学生数据_${new Date().toISOString().split('T')[0]}.xlsx`)
      ElMessage.success(`导出成功，共 ${allData.length} 条`)
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
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

  // 初始化
  onMounted(() => {
    loadData()
  })
  </script>

  <template>
    <div class="min-h-screen mx-0 flex flex-col gap-5 p-4">
      <!-- 搜索表单 -->
      <el-card>
        <el-form :inline="true" class="search-form">
          <el-form-item label="姓名">
            <el-input
              v-model="searchFullName"
              placeholder="请输入姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="专业">
            <el-input
              v-model="searchMajor"
              placeholder="请输入专业"
              clearable
              style="width: 200px"
            />
          </el-form-item>

          <!-- ✅ 年级筛选 -->
          <el-form-item label="年级">
            <el-select
              v-model="searchGrade"
              placeholder="选择年级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="opt in gradeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button
              type="success"
              :icon="Download"
              @click="openExportDialog"
              :loading="exporting"
            >
              导出Excel
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 数据表格 -->
      <el-card>
        <el-table :data="students" v-loading="loading" border stripe>
          <el-table-column prop="fullName" label="姓名" width="100" />
          <el-table-column prop="major" label="专业" width="150" />

          <!-- ✅ 年级列 -->
          <el-table-column label="年级" width="100">
            <template #default="{ row }">
              <el-tag :type="getGradeTagType(row.grade)">
                {{ getGradeLabel(row.grade) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="graduationYear" label="毕业年份" width="100" />

          <el-table-column label="GPA" width="100">
            <template #default="{ row }">
              {{ row.gpa?.toFixed(2) || '-' }}
            </template>
          </el-table-column>

          <el-table-column label="学业成绩" width="100">
            <template #default="{ row }">
              {{ row.academicScore?.toFixed(2) || '-' }}
            </template>
          </el-table-column>

          <el-table-column label="专长成绩" width="100">
            <template #default="{ row }">
              {{ row.specialtyScore?.toFixed(2) || '-' }}
            </template>
          </el-table-column>

          <el-table-column label="综合成绩" width="100">
            <template #default="{ row }">
              {{ row.comprehensiveScore?.toFixed(2) || '-' }}
            </template>
          </el-table-column>

          <el-table-column label="确认状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isConfirmed ? 'success' : 'warning'">
                {{ row.isConfirmed ? '已确认' : '未确认' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDetail(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-row justify="end" align="middle" class="mt-5">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalItems"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </el-row>
      </el-card>

      <!-- 详情弹窗 -->
      <el-dialog
        v-model="showDialog"
        title="学生详情"
        width="900px"
        :close-on-click-modal="false"
      >
        <div v-if="selectedStudent">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">
              {{ selectedStudent.fullName }}
            </el-descriptions-item>
            <el-descriptions-item label="专业">
              {{ selectedStudent.major }}
            </el-descriptions-item>
            <el-descriptions-item label="年级">
              <el-tag :type="getGradeTagType(selectedStudent.grade)">
                {{ getGradeLabel(selectedStudent.grade) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="毕业年份">
              {{ selectedStudent.graduationYear }}
            </el-descriptions-item>

            <el-descriptions-item label="GPA">
              {{ selectedStudent.gpa?.toFixed(2) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="学业成绩">
              {{ selectedStudent.academicScore?.toFixed(2) || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="专长成绩">
              {{ selectedStudent.specialtyScore?.toFixed(2) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="综合成绩">
              {{ selectedStudent.comprehensiveScore?.toFixed(2) || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="确认状态" :span="2">
              <el-tag :type="selectedStudent.isConfirmed ? 'success' : 'warning'">
                {{ selectedStudent.isConfirmed ? '已确认' : '未确认' }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="需求信息" :span="2">
              {{ selectedStudent.demandValue || '暂无' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <template #footer>
          <el-button @click="showDialog = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 导出字段选择弹窗 -->
      <el-dialog
        v-model="exportDialogVisible"
        title="选择导出字段"
        width="500px"
        :close-on-click-modal="false"
      >
        <p class="text-gray-500 mb-3 text-sm">默认导出当前查询条件的所有数据，请选择需要包含的字段：</p>
        <el-checkbox-group v-model="selectedExportFields" class="flex flex-wrap gap-3">
          <el-checkbox
            v-for="field in exportFields"
            :key="field.key"
            :label="field.key"
          >
            {{ field.label }}
          </el-checkbox>
        </el-checkbox-group>
        <template #footer>
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="exporting" @click="confirmExport">确认导出</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
