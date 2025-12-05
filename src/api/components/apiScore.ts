import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

// ========== 类型定义 ==========

/** 审核操作请求参数 */
export interface AuditRequest {
  recordId: number
  comment: string
}

/** ✅ 文件信息接口 */
export interface ProofFileItem {
  fileId: number
  fileName: string
}

/** 撤销申请请求参数 */
export interface RevokeRequest {
  recordId: number
  reason: string
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

// ========== ✅ 文件相关 API ==========

/**
 * ✅ 上传证明文件（教师端也可能需要）
 */
export const uploadProofFile = async (file: File): Promise<{ fileId: number; fileName: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileCategory', 'SCORE_PROOF')
  formData.append('filePurpose', '加分申请证明材料')

  const response = await apiClient.post(`${apiBaseUrl}/api/file/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  if (response.data.code === 200) {
    return {
      fileId: response.data.data.fileId,
      fileName: response.data.data.originalName
    }
  } else {
    throw new Error(response.data.msg || '文件上传失败')
  }
}

/**
 * ✅ 根据 fileId 获取预览 URL
 */
export const getFilePreviewById = async (fileId: number, expiryMinutes: number = 60) => {
  const response = await apiClient.get(`${apiBaseUrl}/api/file/${fileId}/preview`, {
    params: { expiryMinutes }
  })
  return response.data
}

/**
 * ✅ 根据 fileId 下载文件
 */
export const downloadFileById = async (fileId: number, fileName: string) => {
  const response = await apiClient.get(`${apiBaseUrl}/api/file/download/${fileId}`, {
    responseType: 'blob'
  })
  
  const blob = new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * ✅ 获取文件 URL（预览/下载统一接口，兼容旧格式）
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
 * ✅ 获取文件预览 URL（兼容旧格式）
 */
export const getFilePreviewUrl = async (fileUrl: string): Promise<ApiResponse<string>> => {
  return getFileUrl(fileUrl, 0)
}

/**
 * ✅ 获取文件下载 URL（兼容旧格式）
 */
export const getFileDownloadUrl = async (fileUrl: string): Promise<ApiResponse<string>> => {
  return getFileUrl(fileUrl, 1)
}

// ========== 审核相关 API ==========

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
 * ✅ 撤销已通过的申请
 */
export const revokeRecord = async (data: RevokeRequest): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `${apiBaseUrl}/api/student-bonus/audit/revoke`,
    data
  )
  return response.data
}

/**
 * ✅ 获取待审核记录（分页）
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