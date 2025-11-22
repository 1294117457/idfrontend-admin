import ScoreManage from '@/views/score/index.vue'
import ScoreHistory from '@/views/score/history.vue'
import ScoreTemplate from '@/views/score/template.vue'
import SettingIcon from '@/assets/icons/setting.vue' // 导入 setting.vue 组件

export default {
  path: 'score',
  meta: { title: '分数审批', icon: SettingIcon, sort: 2, desc: '管理平台商户处理、商户申请' },
  children: [
    { path: 'index', component: ScoreManage, meta: { title: '分数审核' } },
    { path: 'history', component: ScoreHistory, meta: { title: '审核历史' } },
    { path: 'template', component: ScoreTemplate, meta: { title: '模板管理' } },
  ],
}
