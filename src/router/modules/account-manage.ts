import Account from '@/views/account-manage/index.vue'
import Role from '@/views/account-manage/role.vue'
import Permission from '@/views/account-manage/permission.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'activity',
  meta: { title: '账户管理', icon: SettingIcon, sort: 5 },
  children: [
    { path: 'index', component: Account, meta: { title: '账户管理' } },
    { path: 'role', component: Role, meta: { title: '角色管理' } },
    { path: 'permission', component: Permission, meta: { title: '权限管理' } },
  ],
}
