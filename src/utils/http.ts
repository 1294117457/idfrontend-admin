import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { refreshToken } from '@/api/components/apiLogin'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API, // ✅ 添加 baseURL
  headers: {
    'Content-Type': 'application/json', // 明确指定 Content-Type
  },
  timeout: 10000,
});

// 标记是否正在刷新 token
let isRefreshing = false;
// 存储待重试的请求
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// 处理队列中的请求
const processQueue = (error: any = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      // 使用新 token 重试请求
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('发送请求:', config.url, 'Token:', token ? 'exists' : 'missing')
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 检查业务状态码 401
    if (response.data && response.data.code === 401) {
      console.log('检测到业务状态码 401,token 已过期')
      const error: any = new Error('Token expired')
      error.response = {
        status: 401,
        data: response.data,
        config: response.config
      }
      return Promise.reject(error)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 检查是否是 401 错误
    const is401 = error.response?.status === 401 || 
                  (error.response?.data as any)?.code === 401

    console.log('响应错误:', {
      url: originalRequest?.url,
      status: error.response?.status,
      businessCode: (error.response?.data as any)?.code,
      message: (error.response?.data as any)?.msg,
      is401,
      isRetried: originalRequest?._retry,
      isRefreshing
    })

    if (is401 && originalRequest && !originalRequest._retry) {
      // 如果正在刷新 token,将请求加入队列
      if (isRefreshing) {
        console.log('正在刷新 token,将请求加入队列:', originalRequest.url)
        return new Promise((resolve, reject) => {
          failedQueue.push({ 
            resolve, 
            reject,
            config: originalRequest 
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = localStorage.getItem('refresh_token')
        if (!refreshTokenValue) {
          throw new Error('没有 refresh token')
        }

        console.log('开始刷新 token...')
        
        // 刷新 token
        const newTokens = await refreshToken(refreshTokenValue)
        
        console.log('Token 刷新成功')
        
        // 更新存储的 token
        localStorage.setItem('access_token', newTokens.access_token)
        
        // ✅ 更新原请求的 token
        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`
        
        // 处理队列中的请求
        processQueue();
        
        isRefreshing = false;
        
        console.log('重试原请求:', originalRequest.url)
        // 重试原请求
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error('Token 刷新失败:', refreshError)
        
        // 处理队列中的请求 - 全部失败
        processQueue(refreshError);
        
        isRefreshing = false;
        
        // 刷新失败,清除 token 并跳转登录
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        ElMessage.error('登录已过期,请重新登录')
        
        // 延迟跳转,确保消息显示
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
        
        return Promise.reject(refreshError)
      }
    }

    // 如果不是 401 错误,直接返回错误
    return Promise.reject(error)
  }
)

export default apiClient;