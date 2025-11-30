import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

// ========== 类型定义 ==========

/** 审核操作请求参数 */
export interface AuditRequest {
  recordId: number
  comment: string
}

/** 分页查询请求参数 */
export interface AuditQueryParams {
  page: number
  size: number
  studentId?: string
  studentName?: string
  major?: string
  scoreType?: number
}

/** 审核记录基本信息 */
export interface AuditRecord {
  id: number
  studentId: string
  studentName: string
  major: string
  enrollmentYear: number
  templateName: string
  scoreType: number
  applyScore: number
  status: number
  statusText: string
  submitTime: string
  remark?: string
  proofFiles?: string
  ruleValues?: string
  reviewCount: number
  currentReviewCount: number
  reviewRecords?: string
}

/** 审核记录详情 */
export interface ReviewRecord {
  reviewerId: number
  reviewerName: string
  action: 'approved' | 'rejected'
  comment: string
  timestamp: string
}

/** 分页响应数据 */
export interface PageResponse<T> {
  records: T[]
  total: number
}

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ========== API 方法 ==========

/**
 * ✅ 审核通过
 */
export const approveRecord = async (data: AuditRequest): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `${apiBaseUrl}/api/student-bonus/audit/approve`,
    data
  )
  return response.data
}

/**
 * ✅ 审核驳回
 */
export const rejectRecord = async (data: AuditRequest): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `${apiBaseUrl}/api/student-bonus/audit/reject`,
    data
  )
  return response.data
}

/**
 * ✅ 获取待审核记录（分页）- 修复参数传递
 */
export const getPendingRecordsPaged = async (
  page: number,
  size: number,
  studentId?: string,
  studentName?: string,
  major?: string
): Promise<ApiResponse<PageResponse<AuditRecord>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<AuditRecord>>>(
    `${apiBaseUrl}/api/student-bonus/audit/pending-paged`,
    { 
      params: { 
        page, 
        size, 
        studentId, 
        studentName, 
        major 
      } 
    }
  )
  return response.data
}

/**
 * ✅ 获取审核历史记录（分页）
 */
export const getAuditHistoryPaged = async (
  page: number,
  size: number,
  studentId?: string,
  studentName?: string,
  major?: string
): Promise<ApiResponse<PageResponse<AuditRecord>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<AuditRecord>>>(
    `${apiBaseUrl}/api/student-bonus/audit/history-paged`,
    { 
      params: { 
        page, 
        size, 
        studentId, 
        studentName, 
        major 
      } 
    }
  )
  return response.data
}

/**
 * ✅ 获取文件 URL（预览/下载统一接口）
 */
export const getFileUrl = async (
  fileUrl: string,
  type: 0 | 1 = 0
): Promise<ApiResponse<string>> => {
  const response = await apiClient.get<ApiResponse<string>>(
    `${apiBaseUrl}/api/student-bonus/file/url`,
    { params: { fileUrl, type } }
  )
  return response.data
}

/**
 * ✅ 获取文件预览 URL
 */
export const getFilePreviewUrl = async (fileUrl: string): Promise<ApiResponse<string>> => {
  return getFileUrl(fileUrl, 0)
}

/**
 * ✅ 获取文件下载 URL
 */
export const getFileDownloadUrl = async (fileUrl: string): Promise<ApiResponse<string>> => {
  return getFileUrl(fileUrl, 1)
}