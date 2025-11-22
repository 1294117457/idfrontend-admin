import apiClient from '@/utils/http'

export interface StudentDataItem {
    id: number
    userId: number
    username: string // ✅ 新增
    studentId: string
    studentEmail: string
    fullName: string
    enrollmentYear: number
    graduationYear: number
    major: string
    gpa: number
    academicScore: number
    specialtyScore: number
    comprehensiveScore: number
    foreignLanguageLevel: string
    disciplinaryViolations: number
    failedCourses: number
    specialSkillsRemark: string
    isConfirmed: boolean
  }


// 查询参数
export interface StudentQueryParams {
    studentId?: string
    fullName?: string
    major?: string
    enrollmentYear?: number
    isConfirmed?: boolean
    pageNum: number
    pageSize: number
  }
  

// 分页查询学生数据
export const getStudentDataList = async (params: StudentQueryParams) => {
    const response = await apiClient.get<{
      code: number
      msg: string
      data: {
        list: StudentDataItem[]
        total: number
        pageNum: number
        pageSize: number
      }
    }>('/api/userinfo/getStudentDataList', { params })
    
    return response.data
  }