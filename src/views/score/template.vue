<!-- filepath: d:\XMU\3UP\交互设计\code\ID-frontend-manage\src\views\examine\template.vue -->
<template>
  <div class="p-4">
    <el-card>
      <div class="flex justify-between mb-4">
        <h4 class="text-xl font-bold">加分项模板管理</h4>
        <el-button type="primary" @click="openDialog()">创建模板</el-button>
      </div>
      
      <el-table :data="templateList" border>
        <el-table-column prop="templateName" label="模板名称" />
        <el-table-column label="类型" width="180">
          <template #default="{ row }">
            <el-tag :type="getScoreTypeColor(row.scoreType)">
              {{ getScoreTypeText(row.scoreType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxScore" label="该项总分" width="120" />
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" type="primary" @click="viewDetail(row.id)">查看</el-button>
              <el-button size="small" type="warning" @click="openEditDialog(row.id)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑模板弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑模板' : '创建模板'" 
      width="1000px"
      :close-on-click-modal="false"
    >
      <!-- 步骤1：基本信息 -->
      <div v-if="currentStep === 1">
        <el-form label-width="120px">
          <el-form-item label="模板名称" required>
            <el-input v-model="formData.templateName" placeholder="请输入模板名称" />
          </el-form-item>
          
          <el-form-item label="类型" required>
            <el-select v-model="formData.scoreType" placeholder="请选择类型">
              <el-option label="学术专长" :value="0" />
              <el-option label="综合表现" :value="1" />
              <el-option label="学业成绩" :value="2" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="该项总分" required>
            <el-input-number v-model="formData.maxScore" :min="0" :max="100" />
          </el-form-item>
          
          <!-- ✅ 新增: 审核次数 -->
          <el-form-item label="审核次数" required>
            <el-input-number 
              v-model="formData.reviewCount" 
              :min="1" 
              :max="5"
              placeholder="需要几个人审核"
            />
            <span class="ml-2 text-gray-500 text-sm">
              设置需要几个教师审核通过
            </span>
          </el-form-item>
          
          <el-form-item label="说明">
            <el-input 
              v-model="formData.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入模板说明"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：计分规则 -->
      <div v-show="currentStep === 2">
        <el-alert 
          title="说明：设置不同条件组合对应的得分比例，学生填写时会根据选择的条件自动匹配规则计算分数" 
          type="info" 
          class="mb-4" 
        />
        
        <div class="mb-4">
          <el-button type="primary" @click="addRule">添加规则</el-button>
        </div>
        
        <el-table :data="formData.rules" border max-height="500">
          <el-table-column label="规则名称" width="200">
            <template #default="{ row }">
              <el-input v-model="row.ruleName" size="small" placeholder="如: 国家级一等奖队长" />
            </template>
          </el-table-column>
          
          <el-table-column label="匹配条件" min-width="200">
            <template #default="{ row }">
              <div class="space-y-2">
                <!-- 项目层级 -->
                <div class="flex items-center gap-2">
                  <el-checkbox v-model="row.conditionsObj.enable项目层级" @change="updateConditions(row)">
                    项目层级:
                  </el-checkbox>
                  <el-select 
                    v-if="row.conditionsObj.enable项目层级" 
                    v-model="row.conditionsObj.项目层级" 
                    size="small" 
                    clearable
                    @change="updateConditions(row)"
                  >
                    <el-option label="国际" value="国际" />
                    <el-option label="国家" value="国家" />
                    <el-option label="省级" value="省级" />
                    <el-option label="校级" value="校级" />
                    <el-option label="院级" value="院级" />
                  </el-select>
                </div>
                
                <!-- 获奖等级 -->
                <div class="flex items-center gap-2">
                  <el-checkbox v-model="row.conditionsObj.enable获奖等级" @change="updateConditions(row)">
                    获奖等级:
                  </el-checkbox>
                  <el-select 
                    v-if="row.conditionsObj.enable获奖等级" 
                    v-model="row.conditionsObj.获奖等级" 
                    size="small" 
                    clearable
                    @change="updateConditions(row)"
                  >
                    <el-option label="特等奖/冠军" value="特等奖/冠军" />
                    <el-option label="一等奖/亚军" value="一等奖/亚军" />
                    <el-option label="二等奖/季军" value="二等奖/季军" />
                    <el-option label="三等奖/参与" value="三等奖/参与" />
                  </el-select>
                </div>
                
                <!-- 是否队长 -->
                <div class="flex items-center gap-2">
                  <el-checkbox v-model="row.conditionsObj.enable是否队长" @change="updateConditions(row)">
                    是否队长:
                  </el-checkbox>
                  <el-select 
                    v-if="row.conditionsObj.enable是否队长" 
                    v-model="row.conditionsObj.是否队长" 
                    size="small" 
                    clearable
                    @change="updateConditions(row)"
                  >
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </div>
                
                <!-- 队内排名 -->
                <div class="flex items-center gap-2">
                  <el-checkbox v-model="row.conditionsObj.enable队内排名" @change="updateConditions(row)">
                    队内排名:
                  </el-checkbox>
                  <el-select 
                    v-if="row.conditionsObj.enable队内排名" 
                    v-model="row.conditionsObj.队内排名" 
                    size="small" 
                    clearable
                    @change="updateConditions(row)"
                  >
                    <el-option v-for="i in 20" :key="i" :label="`前${i}名`" :value="`前${i}名`" />
                  </el-select>
                </div>
                
                <!-- 项目时长 -->
                <div class="flex flex-col gap-2">
                  <el-checkbox v-model="row.conditionsObj.enable项目时长" @change="updateConditions(row)">
                    项目时长:
                  </el-checkbox>
                  <div v-if="row.conditionsObj.enable项目时长" class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">单位时间:</span>
                    <el-input-number
                      v-model="row.conditionsObj.时长标准"
                      :min="1"
                      :max="1000"
                      size="small"
                      class="w-[5rem]"
                      @change="updateConditions(row)"
                    />
                    <el-select
                      v-model="row.conditionsObj.时长单位"
                      size="small"
                      class="w-[3rem]"
                      @change="updateConditions(row)"
                    >
                      <el-option
                        v-for="unit in timeUnitOptions"
                        :key="unit.value"
                        :label="unit.label"
                        :value="unit.value"
                      />
                    </el-select>
                    <span class="text-sm text-gray-600">得分:</span>
                    <el-input
                      class="w-[5rem]"                    
                      v-model="row.conditionsObj.每单位分数"
                      disabled
                    />
                    <span class="text-sm text-gray-600">分</span>
                  </div>
                </div>

                <!-- ✅ 新增：分数换算 -->
                <div class="flex  gap-2 flex-col ">
                  <el-checkbox v-model="row.conditionsObj.enable分数换算" @change="updateConditions(row)">
                    分数换算:
                  </el-checkbox>
                  <div v-if="row.conditionsObj.enable分数换算" class="flex flex-col gap-2 w-full">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">最小值:</span>
                      <el-input-number
                        v-model="row.conditionsObj.minRange"
                        :min="0"
                        :max="10"
                        :step="0.01"
                        :precision="2"
                        size="small"
                        style="width: 100px"
                        @change="updateConditions(row)"
                      />
                      <span class="text-sm text-gray-600">最大值:</span>
                      <el-input-number
                        v-model="row.conditionsObj.maxRange"
                        :min="0"
                        :max="10"
                        :step="0.01"
                        :precision="2"
                        size="small"
                        style="width: 100px"
                        @change="updateConditions(row)"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">换算公式:</span>
                      <el-input
                        v-model="row.conditionsObj.formula"
                        size="small"
                        placeholder="如: 100-(4-INPUT)/0.3*11"
                        @change="updateConditions(row)"
                        style="flex: 1"
                      />
                    </div>
                    <div class="text-xs text-blue-500 mt-1">
                      说明: 使用"INPUT"作为输入变量，最终得分 = (公式计算结果) × 得分比例 × 该项总分<br>
                      例如: 输入3.8，总分100，得分比例80%，公式"100-(4-INPUT)/0.3*11"<br>
                      计算: (100-(4-3.8)/0.3*11) × 0.8 × 100% = 92.67 × 0.8 = 74.13分
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="得分比例(%)" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.scorePercentage"
                :min="0"
                :max="100"
                size="small"
                @change="updateConditions(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="优先级" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.priority" :min="0" size="small" />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removeRule($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <el-button v-if="currentStep === 2" @click="currentStep = 1">上一步</el-button>
          <div class="flex-1"></div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="currentStep === 1" type="primary" @click="nextStep">下一步</el-button>
          <el-button v-if="currentStep === 2" type="primary" @click="handleSubmit">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="模板详情" width="70%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模板名称">{{ detailData.templateName }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="getScoreTypeColor(detailData.scoreType)">
            {{ getScoreTypeText(detailData.scoreType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="该项总分">{{ detailData.maxScore }}分</el-descriptions-item>
        <el-descriptions-item label="说明" :span="2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>计分规则</el-divider>
      <el-table :data="detailData.rules" border>
        <el-table-column prop="ruleName" label="规则名称" />
        <el-table-column label="匹配条件" min-width="200">
          <template #default="{ row }">
            {{ formatConditions(row.conditions, row) }}
          </template>
        </el-table-column>
        <el-table-column prop="scorePercentage" label="得分比例" width="100">
          <template #default="{ row }">
            {{ row.scorePercentage }}%
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getTemplateList, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  getTemplateDetail 
} from '@/api/components/apiTemplate'

interface RuleConditionsObj {
  enable项目层级?: boolean
  enable获奖等级?: boolean
  enable是否队长?: boolean
  enable队内排名?: boolean
  enable项目时长?: boolean
  项目层级?: string
  获奖等级?: string
  是否队长?: boolean
  队内排名?: string
  时长标准?: number
  时长单位?: 'hour' | 'day' | 'month' | 'year'
  每单位分数?: number
  
  // ✅ 新增: 分数换算字段
  enable分数换算?: boolean
  minRange?: number
  maxRange?: number
  formula?: string
}

interface ScoringRule {
  id?: number
  ruleName: string
  conditions: string
  conditionsObj: RuleConditionsObj
  scorePercentage: number
  priority: number
  timeStandard?: number
  timeUnit?: 'hour' | 'day' | 'month' | 'year'
  scorePerUnit?: number
  description?: string
}

const timeUnitOptions = [
  { label: '小时', value: 'hour' },
  { label: '天', value: 'day' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
]

const templateList = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentStep = ref(1)
const isEdit = ref(false)
const editingId = ref('')

const formData = reactive({
  templateName: '',
  scoreType: 0,
  maxScore: 0,
  description: '',
  reviewCount: 1,  // ✅ 默认1人审核
  rules: [] as ScoringRule[]
})

const detailData = ref<any>({ rules: [] })

// ✅ 获取类型文本
const getScoreTypeText = (scoreType: number) => {
  const map: Record<number, string> = {
    0: '学术专长(12分)',
    1: '综合表现(8分)',
    2: '学业成绩换算'
  }
  return map[scoreType] || '未知类型'
}

// ✅ 获取类型颜色
const getScoreTypeColor = (scoreType: number) => {
  const map: Record<number, string> = {
    0: 'primary',
    1: 'success',
    2: 'warning'
  }
  return map[scoreType] || 'info'
}

// ✅ 添加规则
const addRule = () => {
  formData.rules.push({
    ruleName: '',
    conditions: '',
    conditionsObj: {
      enable项目时长: false,
      enable分数换算: false
    },
    scorePercentage: 100,
    priority: formData.rules.length,
    timeStandard: undefined,
    timeUnit: 'hour',
    scorePerUnit: undefined
  })
}

// 计算每单位分数
const calculateScorePerUnit = (row: ScoringRule) => {
  if (
    row.conditionsObj.enable项目时长 &&
    row.conditionsObj.时长标准 &&
    row.scorePercentage &&
    formData.maxScore
  ) {
    const totalScore = formData.maxScore * (row.scorePercentage / 100)
    row.conditionsObj.每单位分数 = totalScore
    row.scorePerUnit = row.conditionsObj.每单位分数
  }
}

const removeRule = (index: number) => {
  formData.rules.splice(index, 1)
}

// ✅ 更新条件 (包含分数换算)
const updateConditions = (row: ScoringRule) => {
  const conditions: Record<string, any> = {}

  if (row.conditionsObj.enable项目层级 && row.conditionsObj.项目层级) {
    conditions.项目层级 = row.conditionsObj.项目层级
  }
  if (row.conditionsObj.enable获奖等级 && row.conditionsObj.获奖等级) {
    conditions.获奖等级 = row.conditionsObj.获奖等级
  }
  if (row.conditionsObj.enable是否队长 && row.conditionsObj.是否队长 !== undefined) {
    conditions.是否队长 = row.conditionsObj.是否队长
  }
  if (row.conditionsObj.enable队内排名 && row.conditionsObj.队内排名) {
    conditions.队内排名 = row.conditionsObj.队内排名
  }

  // 时长类规则处理
  if (row.conditionsObj.enable项目时长) {
    calculateScorePerUnit(row)
  } else {
    row.timeUnit = undefined
    row.timeStandard = undefined
    row.scorePerUnit = undefined
  }

  // ✅ 分数换算规则处理
  if (row.conditionsObj.enable分数换算) {
    conditions.分数换算 = {
      minRange: row.conditionsObj.minRange || 0,
      maxRange: row.conditionsObj.maxRange || 4,
      formula: row.conditionsObj.formula || '100-(4-INPUT)/0.3*11'
    }
  }

  row.conditions = JSON.stringify(conditions)
}

// 获取时长单位标签
const getTimeUnitLabel = (unit: string) => {
  const map: Record<string, string> = {
    hour: '小时',
    day: '天',
    month: '月',
    year: '年'
  }
  return map[unit] || unit
}

const nextStep = () => {
  if (!formData.templateName || formData.maxScore <= 0) {
    ElMessage.warning('请填写完整信息')
    return
  }
  currentStep.value++
}

// ✅ 提交时验证和转换
const handleSubmit = async () => {
  if (formData.rules.length === 0) {
    ElMessage.warning('请至少添加一条规则')
    return
  }

  // 最终转换和验证
  formData.rules.forEach((rule) => {
    const conditions: Record<string, any> = {}

    if (rule.conditionsObj.enable项目层级 && rule.conditionsObj.项目层级) {
      conditions.项目层级 = rule.conditionsObj.项目层级
    }
    if (rule.conditionsObj.enable获奖等级 && rule.conditionsObj.获奖等级) {
      conditions.获奖等级 = rule.conditionsObj.获奖等级
    }
    if (rule.conditionsObj.enable是否队长 && rule.conditionsObj.是否队长 !== undefined) {
      conditions.是否队长 = rule.conditionsObj.是否队长
    }
    if (rule.conditionsObj.enable队内排名 && rule.conditionsObj.队内排名) {
      conditions.队内排名 = rule.conditionsObj.队内排名
    }

    // ✅ 时长类规则
    if (rule.conditionsObj.enable项目时长) {
      if (!rule.conditionsObj.时长标准 || !rule.conditionsObj.时长单位) {
        ElMessage.warning(`规则 "${rule.ruleName}" 的时长设置不完整`)
        throw new Error('时长设置不完整')
      }
      rule.timeUnit = rule.conditionsObj.时长单位
      rule.timeStandard = rule.conditionsObj.时长标准
      calculateScorePerUnit(rule)
    }

    // ✅ 分数换算规则
    if (rule.conditionsObj.enable分数换算) {
      if (!rule.conditionsObj.minRange || !rule.conditionsObj.maxRange || !rule.conditionsObj.formula) {
        ElMessage.warning(`规则 "${rule.ruleName}" 的分数换算设置不完整`)
        throw new Error('分数换算设置不完整')
      }
      conditions.分数换算 = {
        minRange: rule.conditionsObj.minRange,
        maxRange: rule.conditionsObj.maxRange,
        formula: rule.conditionsObj.formula
      }
    }

    rule.conditions = JSON.stringify(conditions)

    // 自动生成规则名称
    if (!rule.ruleName) {
      const parts: string[] = []
      if (conditions.项目层级) parts.push(conditions.项目层级)
      if (conditions.获奖等级) parts.push(conditions.获奖等级)
      if (conditions.是否队长) parts.push('队长')
      if (conditions.队内排名) parts.push(conditions.队内排名)
      if (conditions.分数换算) parts.push(`分数换算 ${conditions.分数换算.minRange}-${conditions.分数换算.maxRange}`)
      rule.ruleName = parts.length > 0 ? parts.join(' ') : `规则${rule.priority + 1}`
    }
  })

  try {
    let response
    if (isEdit.value) {
      response = await updateTemplate(editingId.value, formData)
    } else {
      response = await createTemplate(formData)
    }

    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadTemplates()
    } else {
      ElMessage.error(response.msg || '提交失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请检查网络或联系管理员')
  }
}

// ✅ 编辑时的解析逻辑
const openEditDialog = async (id: string) => {
  const response = await getTemplateDetail(id)
  if (response.code === 200) {
    isEdit.value = true
    editingId.value = id
    currentStep.value = 1
    
    const data = response.data
    Object.assign(formData, {
      templateName: data.templateName,
      scoreType: data.scoreType,
      maxScore: data.maxScore,
      description: data.description,
      reviewCount: data.reviewCount || 1,  // ✅ 加载审核次数
      rules: data.rules.map((rule: any) => ({
        id: rule.id,
        ruleName: rule.ruleName,
        conditions: rule.conditions,
        conditionsObj: JSON.parse(rule.conditions || '{}'),
        scorePercentage: rule.scorePercentage,
        priority: rule.priority,
        timeStandard: rule.timeStandard,
        timeUnit: rule.timeUnit,
        scorePerUnit: rule.scorePerUnit,
        description: rule.description
      }))
    })
    
    dialogVisible.value = true
  }
}

// ✅ 格式化条件显示 (包含分数换算)
const formatConditions = (conditions: string, rule: any) => {
  try {
    const obj = JSON.parse(conditions)
    let result = Object.entries(obj)
      .map(([key, value]) => {
        if (key === '分数换算') {
          const conv = value as any
          return `${key}: ${conv.minRange}-${conv.maxRange}, 公式: ${conv.formula}`
        }
        return `${key}: ${value}`
      })
      .join(', ')
    
    // ✅ 如果有时长规则,追加显示
    if (rule.timeUnit) {
      result += `, 时长: 每${rule.timeStandard}${getTimeUnitLabel(rule.timeUnit)}得${rule.scorePerUnit}分`
    }
    
    return result || '-'
  } catch {
    return conditions
  }
}

const loadTemplates = async () => {
  const response = await getTemplateList()
  if (response.code === 200) {
    templateList.value = response.data
  }
}

const openDialog = () => {
  isEdit.value = false
  editingId.value = ''
  currentStep.value = 1
  Object.assign(formData, {
    templateName: '',
    scoreType: 0,
    maxScore: 0,
    description: '',
    reviewCount: 1,  // ✅ 重置为默认值
    rules: []
  })
  dialogVisible.value = true
}

const viewDetail = async (id: string) => {
  const response = await getTemplateDetail(id)
  if (response.code === 200) {
    detailData.value = response.data
    detailDialogVisible.value = true
  }
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
    const response = await deleteTemplate(id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadTemplates()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>