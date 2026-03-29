import SystemSettings from '@/views/system-settings/index.vue'
import SettingIcon from '@/assets/icons/setting.vue'

export default {
  path: 'system',
  meta: { title: '系统设置', icon: SettingIcon, sort: 6, requiresRoles: ['admin', 'super_admin'] },
  component: SystemSettings,
}
