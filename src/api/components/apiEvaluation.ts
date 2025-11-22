import apiClient from '@/utils/http'
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
    const response = await apiClient.get<{
      code: number
      msg: string
      data: PageResult<EvaluationApplication>
    }>('/api/evaluation/list', { params })
    
    return response.data
  }
  
  // 教师端 - 审批申请
  export const reviewApplication = async (data: ReviewRequest) => {
    const response = await apiClient.post<{
      code: number
      msg: string
      data: string
    }>('/api/evaluation/review', data)
    
    return response.data
  }
  
  // 下载附件
  export const downloadAttachment = async (applicationId: number, objectName: string) => {
    const response = await apiClient.get(
      `/api/evaluation/download/${applicationId}`,
      {
        params: { objectName },
        responseType: 'blob'
      }
    )
    
    return response.data
  }