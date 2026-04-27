import apiClient from '@common/utils/http'

export const getSystemConfig = async (key: string) => {
  return await apiClient.get(`/api/system/config/${key}`)
}

export const setSystemConfig = async (key: string, value: string) => {
  return await apiClient.put(`/api/system/config/${key}`, { value })
}
