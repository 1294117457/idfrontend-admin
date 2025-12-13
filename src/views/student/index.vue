<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  // ✅ 确认导入正确
  import { getStudentDataList, type StudentDataItem, type StudentQueryParams } from '@/api/components/apiStudent'
  import * as XLSX from 'xlsx'
  
  // 搜索相关
  const searchStudentId = ref('')
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
  
  // ✅ 年级选项 (1-7: 大一到研三)
  const gradeOptions = [
    { label: '大一', value: 1 },
    { label: '大二', value: 2 },
    { label: '大三', value: 3 },
    { label: '大四', value: 4 },
    { label: '研一', value: 5 },
    { label: '研二', value: 6 },
    { label: '研三', value: 7 }
  ]
  
  // ✅ 根据年级获取标签颜色
  const getGradeTagType = (grade: number | undefined | null): string => {
    if (grade === undefined || grade === null) return 'info'
    
    if (grade <= 2) return 'success'   // 大一/大二
    if (grade <= 4) return 'primary'   // 大三/大四
    if (grade <= 6) return 'warning'   // 研一/研二
    return 'info'                      // 研三
  }
  
  // ✅ 获取年级显示文本
  const getGradeLabel = (grade: number | undefined | null): string => {
    if (grade === undefined || grade === null) return '-'
    const option = gradeOptions.find(opt => opt.value === grade)
    return option ? option.label : `年级${grade}`
  }
  
  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      const params: StudentQueryParams = {
        studentId: searchStudentId.value || undefined,
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
  
  // 筛选
  const handleFilter = () => {
    currentPage.value = 1
    loadData()
  }
  
  // 重置
  const handleReset = () => {
    searchStudentId.value = ''
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
  
  // 导出Excel
  const exportToExcel = () => {
    if (students.value.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }
  
    exporting.value = true
    try {
      const data = students.value.map(s => ({
        '学号': s.studentId,
        '姓名': s.fullName,
        '专业': s.major,
        '年级': getGradeLabel(s.grade),
        '毕业年份': s.graduationYear,
        'GPA': s.gpa?.toFixed(2) || '-',
        '学业成绩': s.academicScore?.toFixed(2) || '-',
        '专长成绩': s.specialtyScore?.toFixed(2) || '-',
        '综合成绩': s.comprehensiveScore?.toFixed(2) || '-',
        '确认状态': s.isConfirmed ? '已确认' : '未确认'
      }))
  
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '学生数据')
  
      const fileName = `学生数据_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
  
      ElMessage.success('导出成功')
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
          <el-form-item label="学号">
            <el-input 
              v-model="searchStudentId" 
              placeholder="请输入学号" 
              clearable 
              style="width: 200px"
            />
          </el-form-item>
          
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
              placeholder="请选择年级" 
              clearable 
              style="width: 150px"
            >
              <el-option 
                v-for="option in gradeOptions" 
                :key="option.value" 
                :label="option.label" 
                :value="option.value" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button 
              type="success" 
              :icon="Download" 
              @click="exportToExcel"
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
          <el-table-column prop="studentId" label="学号" width="120" />
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
            <el-descriptions-item label="学号">
              {{ selectedStudent.studentId }}
            </el-descriptions-item>
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
            <el-descriptions-item label="学生邮箱">
              {{ selectedStudent.studentEmail }}
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
    </div>
  </template>