<!-- filepath: d:\XMU\3UP\交互设计\codeGithub\idfrontend-admin\src\views\student\index.vue -->
<template>
  <div class="min-h-screen mx-0 flex flex-col gap-5 p-4">
    <el-card>
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-[20px] font-bold text-gray-800">学生信息管理</h4>
        <el-button 
          type="success" 
          @click="handleExport" 
          :loading="exporting"
          :disabled="students.length === 0"
        >
          <el-icon class="mr-2"><Download /></el-icon>
          导出 Excel
        </el-button>
      </div>

      <!-- 搜索区域 -->
      <el-row justify="space-between" align="bottom" class="filter mb-4">
        <el-row align="bottom" :gutter="20" style="width: 100%">
          <el-col :span="5">
            <label class="text-sm">学号</label>
            <el-input v-model="searchStudentId" placeholder="搜索学号" clearable />
          </el-col>
          <el-col :span="5">
            <label class="text-sm mb-1">姓名</label>
            <el-input v-model="searchFullName" placeholder="搜索姓名" clearable />
          </el-col>
          <el-col :span="5">
            <label class="text-sm mb-1">专业</label>
            <el-input v-model="searchMajor" placeholder="搜索专业" clearable />
          </el-col>
          <!-- ✅ 改为入学年份筛选 -->
          <el-col :span="4">
            <label class="text-sm mb-1">入学年份</label>
            <el-select
              v-model="searchGrade"
              placeholder="选择年份"
              clearable
              style="width: 100%"
            >
              <el-option 
                v-for="year in gradeYearOptions" 
                :key="year" 
                :value="year" 
                :label="`${year}级`" 
              />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-button type="primary" @click="handleFilter">筛选</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </el-row>

      <!-- 表格部分 -->
      <el-table
        v-loading="loading"
        class="mt-5 overflow-x-auto"
        :data="students"
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

        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="fullName" label="姓名" width="100" />
        <el-table-column prop="major" label="专业" width="150" show-overflow-tooltip />
        
        <!-- ✅ 入学年份列（显示为 2022级） -->
        <el-table-column label="年级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getGradeTagType(row.grade)">
              {{ row.grade ? `${row.grade}级` : '-' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 毕业年份列 -->
        <el-table-column label="毕业年份" width="100" align="center">
          <template #default="{ row }">
            {{ row.graduationYear || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="gpa" label="GPA" width="80">
          <template #default="{ row }">
            {{ row.gpa?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="academicScore" label="学业成绩" width="100">
          <template #default="{ row }">
            {{ row.academicScore?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="specialtyScore" label="专长成绩" width="100">
          <template #default="{ row }">
            {{ row.specialtyScore?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="comprehensiveScore" label="综合成绩" width="100">
          <template #default="{ row }">
            {{ row.comprehensiveScore?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="确认状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isConfirmed ? 'success' : 'warning'">
              {{ row.isConfirmed ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="handleViewDetail(row)"
            >
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
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
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
          <el-descriptions-item label="用户名">{{ selectedStudent.username }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedStudent.fullName }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedStudent.studentEmail }}</el-descriptions-item>
          <el-descriptions-item label="专业" :span="2">{{ selectedStudent.major }}</el-descriptions-item>
          
          <!-- ✅ 入学年份（显示为 2022级） -->
          <el-descriptions-item label="年级">
            <el-tag :type="getGradeTagType(selectedStudent.grade)" size="large">
              {{ selectedStudent.grade ? `${selectedStudent.grade}级` : '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="毕业年份">{{ selectedStudent.graduationYear || '-' }}</el-descriptions-item>
          
          <el-descriptions-item label="绩点 (GPA)">
            <el-tag type="primary" size="large">
              {{ selectedStudent.gpa?.toFixed(2) || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="学业成绩">
            <el-tag type="success" size="large">
              {{ selectedStudent.academicScore?.toFixed(2) || '-' }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="专长成绩">{{ selectedStudent.specialtyScore?.toFixed(2) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="综合成绩">{{ selectedStudent.comprehensiveScore?.toFixed(2) || '-' }}</el-descriptions-item>
          
          <el-descriptions-item label="确认状态" :span="2">
            <el-tag :type="selectedStudent.isConfirmed ? 'success' : 'warning'" size="large">
              {{ selectedStudent.isConfirmed ? '已确认' : '未确认' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getStudentDataList, type StudentDataItem } from '@/api/components/apiStudent'
import * as XLSX from 'xlsx'

// 搜索相关
const searchStudentId = ref('')
const searchFullName = ref('')
const searchMajor = ref('')
const searchGrade = ref<number | undefined>(undefined)  // ✅ 入学年份筛选

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

// ✅ 生成年份选项（从当前年份往前推10年）
const gradeYearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear - i)
  }
  return years
})

// ✅ 根据入学年份获取标签颜色
const getGradeTagType = (grade: number | undefined | null): string => {
  if (grade === undefined || grade === null) return 'info'
  const currentYear = new Date().getFullYear()
  const yearsAgo = currentYear - grade
  
  if (yearsAgo <= 1) return 'success'    // 大一/研一
  if (yearsAgo <= 2) return 'primary'    // 大二/研二
  if (yearsAgo <= 3) return 'warning'    // 大三/研三
  return 'info'                          // 大四及以上
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getStudentDataList({
      studentId: searchStudentId.value || undefined,
      fullName: searchFullName.value || undefined,
      major: searchMajor.value || undefined,
      grade: searchGrade.value,  // ✅ 使用入学年份筛选
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    
    if (response.code === 200) {
      students.value = response.data.list || []
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
  searchGrade.value = undefined  // ✅ 重置入学年份
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
const handleViewDetail = (row: StudentDataItem) => {
  selectedStudent.value = row
  showDialog.value = true
}

// 导出 Excel
const handleExport = async () => {
  exporting.value = true
  try {
    const response = await getStudentDataList({
      studentId: searchStudentId.value || undefined,
      fullName: searchFullName.value || undefined,
      major: searchMajor.value || undefined,
      grade: searchGrade.value,
      pageNum: 1,
      pageSize: 10000
    })
    
    if (response.code === 200) {
      const data = response.data.list.map((item, index) => ({
        '序号': index + 1,
        '用户名': item.username,
        '学号': item.studentId,
        '姓名': item.fullName,
        '专业': item.major,
        '年级': item.grade ? `${item.grade}级` : '-',  // ✅ 显示为 2022级
        '毕业年份': item.graduationYear || '-',
        'GPA': item.gpa?.toFixed(2) || '-',
        '学业成绩': item.academicScore?.toFixed(2) || '-',
        '专长成绩': item.specialtyScore?.toFixed(2) || '-',
        '综合成绩': item.comprehensiveScore?.toFixed(2) || '-',
        '确认状态': item.isConfirmed ? '已确认' : '未确认'
      }))
      
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '学生信息')
      XLSX.writeFile(wb, `学生信息_${new Date().toLocaleDateString()}.xlsx`)
      
      ElMessage.success('导出成功')
    } else {
      ElMessage.error('导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>