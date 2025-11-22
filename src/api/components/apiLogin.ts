import apiClient from '@/utils/http'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_BASE_API

export interface LoginDto {
  username: string;
  password: string;
  verifyCode: string;
  captchaId: string;
}

export interface resType {
  code: number;
  msg: string;
  data: string;
}

// ✅ Token 响应接口 - 使用下划线命名
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ✅ 登录响应 DTO - 使用驼峰命名
export interface LoginODTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResType {
  code: number;
  msg: string;
  data: LoginODTO;
}

// ✅ 刷新 token - 使用原生 axios,转换字段名
export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  try {
    const response = await axios.post<{
      code: number;
      msg: string;
      data: LoginODTO; // 后端返回驼峰
    }>(
      `${apiBaseUrl}/api/authserver/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('刷新 token 响应:', response.data);
    
    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '刷新失败');
    }
    
    // ✅ 转换为下划线命名
    return {
      access_token: response.data.data.accessToken,
      refresh_token: response.data.data.refreshToken,
      expires_in: response.data.data.expiresIn
    };
  } catch (error) {
    console.error('刷新 token 失败:', error);
    throw new Error('刷新token失败');
  }
};

// ✅ 登录
export const loginPost = async (logdto: LoginDto): Promise<LoginResType> => {
  try {
    const response = await apiClient.post<LoginResType>('/api/authserver/login', logdto);
    return response.data;
  } catch (error) {
    throw new Error('登录请求失败,请稍后重试');
  }
};
// ✅ 新增: 管理员端登录
export const adminLoginPost = async (logdto: LoginDto): Promise<LoginResType> => {
  try {
    const response = await apiClient.post<LoginResType>('/api/authserver/admin/login', logdto);
    return response.data;
  } catch (error) {
    throw new Error('登录请求失败,请稍后重试');
  }
};
// ✅ 发送邮箱验证码
export const sentEmailCode = async (email: string) => {
  try {
    const response = await apiClient.post<resType>('/api/authserver/sendEmailCode', { email });
    return response.data;
  } catch (error) {
    throw new Error('邮箱验证码请求失败,请稍后重试');
  }
}

// ✅ 注册
export interface RegisterItem {
  username: string;
  password: string;
  email: string;
  code: string;
}

export const regesterRequest = async (reItem: RegisterItem) => {
  try {
    const response = await apiClient.post<resType>('/api/authserver/register', reItem);
    return response.data;
  } catch (error) {
    throw new Error('注册请求失败,请稍后重试');
  }
}