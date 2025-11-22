import DemondManage from '@/views/demond/index.vue'
import DemondHistory from '@/views/demond/index.vue'
import DemondTemplate from '@/views/demond/index.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'evaluation',
  meta: { title: '需求审批', icon: SettingIcon, sort: 3 },
  children: [
    { path: 'index', component: DemondManage, meta: { title: '需求审核' } },
    { path: 'history', component: DemondHistory, meta: { title: '审核历史' } },
    { path: 'template', component: DemondTemplate, meta: { title: '模板管理' } },
  ],
}
