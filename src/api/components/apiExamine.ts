import apiClient from '@/utils/http'
const apiBaseUrl = import.meta.env.VITE_BASE_API

// 待审核
export const getPendingRecords = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-audit/pending`)
  return response.data
}

// 全部审核记录
export const getAllRecords = async () => {
  const response = await apiClient.get(`${apiBaseUrl}/api/bonus-audit/all`)
  return response.data
}

// 审核通过
export const approveRecord = async (data: { recordId: string; comment: string }) => {
  const response = await apiClient.post('/api/student-bonus/audit/approve', data)
  return response.data
}


// 审核拒绝
export const rejectRecord = async (data: { recordId: string; comment: string }) => {
  const response = await apiClient.post('/api/student-bonus/audit/reject', data)
  return response.data
}

// 获取待审核记录（分页）
export const getPendingRecordsPaged = async (
  page: number,
  size: number,
  studentId?: string,
  studentName?: string,
  major?: string,
  scoreType?: number
) => {
  const response = await apiClient.get('/api/student-bonus/audit/pending-paged', {
    params: { page, size, studentId, studentName, major, scoreType }
  })
  return response.data
}


// 获取审核历史记录（分页）
export const getAuditHistoryPaged = async (
  page: number,
  size: number,
  studentId?: string,
  studentName?: string,
  major?: string,
  scoreType?: number
) => {
  const response = await apiClient.get('/api/student-bonus/audit/history-paged', {
    params: { page, size, studentId, studentName, major, scoreType }
  })
  return response.data
}