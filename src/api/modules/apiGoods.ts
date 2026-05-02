import apiClient from '@common/utils/http'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface GoodsAuditDetail {
  goodsId: string
  shareRatioCategory: string
  name: string
  originalPrice: number
  salePrice: number
  unit: string
  origin: string
  barcode: string
  shareRatio: number
  creator: string
}
