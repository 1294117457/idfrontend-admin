import apiClient from '@/utils/http' // 导入拦截器实例
import { AxiosError } from 'axios' // 假设 apiBaseUrl 从环境变量获取
const apiBaseUrl = import.meta.env.VITE_BASE_API
export interface GoodsAuditDetail {
    /** 商品ID */
    goodsId: string
  /** 分账比例分类 */
  shareRatioCategory: string
  /** 商品名称 */
  name: string
  /** 原价 */
  originalPrice: number
  /** 销售价格 */
  salePrice: number
  /** 单位 */
  unit: string
  /** 产地 */
  origin: string
  /** 条码 */
  barcode: string
  /** 分帐比例 */
  shareRatio: number
//   创建人
    creator: string
}
