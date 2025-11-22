<template>
  <div class="min-h-screen max-w-[80rem] mx-0 flex flex-col gap-5 p-4">
    <el-card>
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-[20px] font-bold text-gray-800">学生信息管理</h4>
        <!-- ✅ 导出按钮 -->
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
          <el-col :span="4">
            <label class="text-sm mb-1">确认状态</label>
            <el-select
              v-model="searchIsConfirmed"
              placeholder="选择状态"
              clearable
              style="width: 100%"
            >
              <el-option :value="true" label="已确认" />
              <el-option :value="false" label="未确认" />
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
        class="mt-5 overflow-x-auto "
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
        
        <el-table-column label="入学/毕业年份" width="150">
          <template #default="{ row }">
            {{ row.enrollmentYear }} / {{ row.graduationYear }}
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
        
        <el-table-column prop="foreignLanguageLevel" label="外语水平" width="120" />
        
        <el-table-column label="违纪/挂科" width="100">
          <template #default="{ row }">
            {{ row.disciplinaryViolations }} / {{ row.failedCourses }}
          </template>
        </el-table-column>
        
        <el-table-column prop="specialSkillsRemark" label="特殊技能" width="150" show-overflow-tooltip />
        
        <el-table-column label="确认状态" width="100" fixed="right">
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
          <el-descriptions-item label="入学年份">{{ selectedStudent.enrollmentYear }}</el-descriptions-item>
          <el-descriptions-item label="毕业年份">{{ selectedStudent.graduationYear }}</el-descriptions-item>
          
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
          
          <el-descriptions-item label="外语水平" :span="2">
            {{ selectedStudent.foreignLanguageLevel || '-' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="违纪次数">{{ selectedStudent.disciplinaryViolations }}</el-descriptions-item>
          <el-descriptions-item label="挂科次数">{{ selectedStudent.failedCourses }}</el-descriptions-item>
          
          <el-descriptions-item label="确认状态" :span="2">
            <el-tag :type="selectedStudent.isConfirmed ? 'success' : 'warning'" size="large">
              {{ selectedStudent.isConfirmed ? '已确认' : '未确认' }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="特殊技能" :span="2">
            {{ selectedStudent.specialSkillsRemark || '-' }}
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getStudentDataList, type StudentDataItem } from '@/api/components/apiStudent'
import * as XLSX from 'xlsx'

// 搜索相关
const searchStudentId = ref('')
const searchFullName = ref('')
const searchMajor = ref('')
const searchIsConfirmed = ref<boolean | null>(null)

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

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getStudentDataList({
      studentId: searchStudentId.value || undefined,
      fullName: searchFullName.value || undefined,
      major: searchMajor.value || undefined,
      isConfirmed: searchIsConfirmed.value ?? undefined,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    
    if (response.code === 200) {
      students.value = response.data.list || []
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

// ✅ 导出 Excel (前端实现)
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      '是否导出当前筛选条件下的所有学生数据?',
      '导出确认',
      {
        confirmButtonText: '确定导出',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    exporting.value = true

    // 获取所有数据(不分页)
    const response = await getStudentDataList({
      studentId: searchStudentId.value || undefined,
      fullName: searchFullName.value || undefined,
      major: searchMajor.value || undefined,
      isConfirmed: searchIsConfirmed.value ?? undefined,
      pageNum: 1,
      pageSize: 10000 // 获取所有数据
    })

    if (response.code !== 200 || !response.data.list || response.data.list.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const allStudents = response.data.list

    // ✅ 转换数据为 Excel 格式
    const excelData = allStudents.map((student, index) => ({
      '序号': index + 1,
      '用户名': student.username || '-',
      '学号': student.studentId || '-',
      '姓名': student.fullName || '-',
      '邮箱': student.studentEmail || '-',
      '专业': student.major || '-',
      '入学年份': student.enrollmentYear || '-',
      '毕业年份': student.graduationYear || '-',
      'GPA': student.gpa ? student.gpa.toFixed(2) : '-',
      '学业成绩': student.academicScore ? student.academicScore.toFixed(2) : '-',
      '专长成绩': student.specialtyScore ? student.specialtyScore.toFixed(2) : '-',
      '综合成绩': student.comprehensiveScore ? student.comprehensiveScore.toFixed(2) : '-',
      '外语水平': student.foreignLanguageLevel || '-',
      '违纪次数': student.disciplinaryViolations ?? '-',
      '挂科次数': student.failedCourses ?? '-',
      '特殊技能': student.specialSkillsRemark || '-',
      '确认状态': student.isConfirmed ? '已确认' : '未确认'
    }))

    // ✅ 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生数据')

    // ✅ 设置列宽
    const colWidths = [
      { wch: 6 },  // 序号
      { wch: 12 }, // 用户名
      { wch: 12 }, // 学号
      { wch: 10 }, // 姓名
      { wch: 25 }, // 邮箱
      { wch: 20 }, // 专业
      { wch: 10 }, // 入学年份
      { wch: 10 }, // 毕业年份
      { wch: 8 },  // GPA
      { wch: 10 }, // 学业成绩
      { wch: 10 }, // 专长成绩
      { wch: 10 }, // 综合成绩
      { wch: 20 }, // 外语水平
      { wch: 10 }, // 违纪次数
      { wch: 10 }, // 挂科次数
      { wch: 30 }, // 特殊技能
      { wch: 10 }  // 确认状态
    ]
    worksheet['!cols'] = colWidths

    // ✅ 生成文件名
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/[/:]/g, '-').replace(/\s/g, '_')
    
    const fileName = `学生数据_${timestamp}.xlsx`

    // ✅ 下载文件
    XLSX.writeFile(workbook, fileName)

    ElMessage.success(`成功导出 ${allStudents.length} 条学生数据`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
    }
  } finally {
    exporting.value = false
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
  searchIsConfirmed.value = null
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

onMounted(() => {
  loadData()
})
</script>