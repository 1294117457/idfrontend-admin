import ScoreTemplate from '@/views/template/scoreTemplate.vue'
import ScoreAttribute from '@/views/template/scoreAttribute.vue'
import DemandTemplate from '@/views/template/demandTemplate.vue'
import FieldConfig from '@/views/template/fieldConfig.vue'
import SettingIcon from '@/assets/icons/setting.vue'

export default {
  path: 'demand',
  meta: { title: '模板管理', icon: SettingIcon, sort: 3, requiresRoles: ['admin', 'super_admin'] },
  children: [
    { path: 'scoreTemplate',  component: ScoreTemplate,  meta: { title: '分数模板' } },
    { path: 'demandTemplate', component: DemandTemplate, meta: { title: '需求模板' } },
    { path: 'scoreAttribute', component: ScoreAttribute, meta: { title: '属性管理' } },
    { path: 'fieldConfig',    component: FieldConfig,    meta: { title: '字段管理' } },
  ],
}
