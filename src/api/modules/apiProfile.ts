import apiClient from '@common/utils/http'

// 发送验证码====
export interface EmailItem {
    status: string;
    validMinutes: number;
}

export const sendEmailCode = async (email: string) => {
  return await apiClient.post('/api/userinfo/sendEmailCode', { email });
};

// 绑定学生信息===
export interface StudentItem {
  email: string;
  code: string;
  fullName: string;
  major: string;
  enrollmentYear: number;
  graduationYear: number;
}

export interface BindItem{
    status: string;
    studentId: string;
}

export const bindStudentInfo = async (studentData: StudentItem) => {
  return await apiClient.post('/api/userinfo/bindStudentInfo', studentData);
};

// 查询用户完整信息===
export interface UserInfoItem {
  // 用户信息
  userId: number;
  username: string;
  phone: string;
  email: string;
  
  // 学生信息
  studentId: string;
  studentEmail: string;
  fullName: string;
  enrollmentYear: number;
  graduationYear: number;
  major: string;
  academicScore: number;
  specialtyScore: number;
  comprehensiveScore: number;
  foreignLanguageLevel: string;
  disciplinaryViolations: number;
  failedCourses: number;
  specialSkillsRemark: string;
  recommendationStatus: string;
}

export const getUserInfo = async () => {
  return await apiClient.get('/api/userinfo/getUserInfo');
};

// 更新学生信息(需要验证码)===
export interface UpdateStudentItem {
  email: string;      // 新的学生邮箱
  code: string;       // 邮箱验证码
  fullName: string;   // 姓名
  major: string;      // 专业
}

export const updateStudentInfo = async (updateData: UpdateStudentItem) => {
  return await apiClient.put('/api/userinfo/updateStudentInfo', updateData);
};
