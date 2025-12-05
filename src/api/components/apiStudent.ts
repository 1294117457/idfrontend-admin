import apiClient from '@/utils/http'

export interface StudentDataItem {
  id: number
  userId: number
  username: string
  studentId: string
  studentEmail: string
  fullName: string
  grade: number           // ✅ 入学年份（如 2022、2023）
  graduationYear: number  // 毕业年份
  major: string
  gpa: number
  academicScore: number
  specialtyScore: number
  comprehensiveScore: number
  isConfirmed: boolean
  demandValue?: string
  demandFiles?: string
}

// 查询参数
export interface StudentQueryParams {
  studentId?: string
  fullName?: string
  major?: string
  grade?: number          // ✅ 入学年份筛选
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