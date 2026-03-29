import apiClient from '@/utils/http'

export const getSystemConfig = async (key: string) => {
  const response = await apiClient.get<{ code: number; msg: string; data: string }>(
    `/api/system/config/${key}`
  )
  return response.data
}

export const setSystemConfig = async (key: string, value: string) => {
  const response = await apiClient.put<{ code: number; msg: string; data: null }>(
    `/api/system/config/${key}`,
    { value }
  )
  return response.data
}
