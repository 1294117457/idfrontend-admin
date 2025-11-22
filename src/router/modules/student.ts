import ServiceProviderCreate from '@/views/student/index.vue'
import ServiceProviderManage from '@/views/student/manage.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'student',
  // component: ValidatePage,
  meta: { title: '学生列表', icon: SettingIcon,sort:4 },
  children: [
    { path: 'index', component: ServiceProviderCreate, meta: { title: '学生列表' } },
    { path: 'manage', component: ServiceProviderManage, meta: { title: '变更管理' } },
  ],
}
