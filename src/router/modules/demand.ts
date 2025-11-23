import DemandManage from '@/views/demand/index.vue'
import DemandHistory from '@/views/demand/history.vue'
import DemandTemplate from '@/views/demand/template.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'demand',
  meta: { title: '需求审批', icon: SettingIcon, sort: 3 },
  children: [
    { path: 'index', component: DemandManage, meta: { title: '需求审核' } },
    { path: 'history', component: DemandHistory, meta: { title: '审核历史' } },
    { path: 'template', component: DemandTemplate, meta: { title: '模板管理' } },
  ],
}
