import ScoreTemplate from '@/views/template/scoreTemplate.vue'
import DemandTemplate from '@/views/template/demandTemplate.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'demand',
  meta: { title: '模板管理', icon: SettingIcon, sort: 3 },
  children: [
    { path: 'scoreTemplate', component: ScoreTemplate, meta: { title: '分数模板' } },
    { path: 'demandTemplate', component: DemandTemplate, meta: { title: '需求模板' } },
  ],
}
