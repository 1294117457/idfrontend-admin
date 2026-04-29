import apiClient from '@common/utils/http'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_BASE_API

// 分页查询参数
export interface EvaluationQueryParams {
    studentId?: string
    studentName?: string
    status?: string
    pageNum?: number
    pageSize?: number
  }
  
  // 分页结果
  export interface PageResult<T> {
    list: T[]
    total: number
    pageNum: number
    pageSize: number
    pages: number
  }
  
  // 审批请求
  export interface ReviewRequest {
    applicationId: number
    status: string  // approved 或 rejected
    reviewComment: string
  }
  
  // 教师端 - 分页查询申请列表
  export const getApplicationList = async (params: EvaluationQueryParams) => {
    return await apiClient.get('/api/evaluation/list', { params })
  }
  
  // 教师端 - 审批申请
  export const reviewApplication = async (data: ReviewRequest) => {
    return await apiClient.post('/api/evaluation/review', data)
  }
  
  // 下载附件
  export const downloadAttachment = async (applicationId: number, objectName: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(
      `${apiBaseUrl}/api/evaluation/download/${applicationId}`,
      {
        params: { objectName },
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
    
    return response.data
  }
