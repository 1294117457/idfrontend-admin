import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export const getSystemConfig = async (key: string): Promise<ApiResponse<any>> => {
  return await apiClient.get(`/api/system/config/${key}`)
}

export const setSystemConfig = async (key: string, value: string): Promise<ApiResponse<any>> => {
  return await apiClient.put(`/api/system/config/${key}`, { value })
}
