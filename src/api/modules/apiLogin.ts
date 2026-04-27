import apiClient from '@common/utils/http'
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

// ✅ 统一使用驼峰命名
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResType {
  code: number;
  msg: string;
  data: TokenResponse;
}

// ✅ 刷新 token - 使用原生 axios,转换字段名
export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  try {
    const response = await axios.post<{
      code: number;
      msg: string;
      data: TokenResponse;
    }>(
      `${apiBaseUrl}/api/authserver/refresh`,
      { refreshToken: refreshToken },  // ✅ 发送驼峰命名
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('刷新 token 响应:', response.data);
    
    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '刷新失败');
    }
    
    // ✅ 直接返回驼峰命名
    return response.data.data;
  } catch (error) {
    console.error('刷新 token 失败:', error);
    throw new Error('刷新token失败');
  }
};


// ✅ 登录
export const loginPost = async (logdto: LoginDto): Promise<LoginResType> => {
  return await apiClient.post('/api/authserver/login', logdto);
};
// ✅ 新增: 管理员端登录
export const adminLoginPost = async (logdto: LoginDto): Promise<LoginResType> => {
  return await apiClient.post('/api/authserver/admin/login', logdto);
};
// ✅ 发送邮箱验证码
export const sentEmailCode = async (email: string) => {
  return await apiClient.post('/api/authserver/sendEmailCode', { email });
}

// ✅ 注册
export interface RegisterItem {
  username: string;  // 学校邮箱（xmu.edu.cn 结尾）
  password: string;
  code: string;
}

export const regesterRequest = async (reItem: RegisterItem) => {
  return await apiClient.post('/api/authserver/register', reItem);
}

// 找回密码接口
export interface ForgotPasswordRequest {
  username: string
  code: string
  newPassword: string
  confirmPassword: string
}

export const sendResetCode = async (email: string) => {
  return await apiClient.post('/api/authserver/sendResetCode', { email });
}

export const resetPassword = async (data: ForgotPasswordRequest) => {
  return await apiClient.post('/api/authserver/reset-password', data);
}
// 获取验证码图片
// ✅ 验证码相关接口
export interface CaptchaResponse {
  captchaId: string;
  base64: string;
}

// ✅ 获取验证码
export const getCaptcha = async (): Promise<CaptchaResponse> => {
  try {
    const response = await axios.get<CaptchaResponse>(
      `${apiBaseUrl}/api/authserver/captcha/generate`
    );
    return response.data;
  } catch (error) {
    console.error('获取验证码失败:', error);
    throw new Error('获取验证码失败');
  }
};