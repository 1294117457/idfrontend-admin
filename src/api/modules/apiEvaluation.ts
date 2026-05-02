import apiClient from '@common/utils/http'
import axios from 'axios'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface EvaluationQueryParams {
  studentId?: string
  studentName?: string
  status?: string
  pageNum?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

export interface ReviewRequest {
  applicationId: number
  status: string
  reviewComment: string
}

export const getApplicationList = async (params: EvaluationQueryParams): Promise<ApiResponse<any>> => {
  return await apiClient.get('/api/evaluation/list', { params })
}

export const reviewApplication = async (data: ReviewRequest): Promise<ApiResponse<any>> => {
  return await apiClient.post('/api/evaluation/review', data)
}

export const downloadAttachment = async (applicationId: number, objectName: string) => {
  const token = localStorage.getItem('accessToken')
  const response = await axios.get(
    `${import.meta.env.VITE_BASE_API}/api/evaluation/download/${applicationId}`,
    {
      params: { objectName },
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  return response.data
}
