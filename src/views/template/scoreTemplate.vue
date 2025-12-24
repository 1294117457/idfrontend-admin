<!-- filepath: d:\XMU\3UP\交互设计\codeGithub\idfrontend-admin\src\views\template\scoreTemplate.vue -->
<template>
  <div class="p-4">
    <el-card>
      <div class="flex justify-between mb-4">
        <h4 class="text-xl font-bold">加分项模板管理</h4>
        <el-button type="primary" @click="openDialog()">创建模板</el-button>
      </div>
      
      <el-table :data="templateList" border>
        <el-table-column prop="templateName" label="模板名称" />
        <el-table-column label="模板类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.templateType === 'CONDITION' ? 'success' : 'warning'">
              {{ row.templateType === 'CONDITION' ? '条件模板' : '换算模板' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="180">
          <template #default="{ row }">
            <el-tag :type="getScoreTypeColor(row.scoreType)">
              {{ getScoreTypeText(row.scoreType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="templateMaxScore" label="该项总分" width="120" />
        <el-table-column prop="reviewCount" label="审核次数" width="100" align="center" />
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

    <!-- ✅ 单弹窗: 创建/编辑模板 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑模板' : '创建模板'" 
      width="1400px"
    >
      <!-- 模板基本信息 -->
      <el-card shadow="never" class="mb-4">
        <template #header>
          <span class="font-bold">模板信息</span>
        </template>
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模板名称" required>
                <el-input v-model="formData.templateName" placeholder="请输入模板名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="模板类型" required>
                <el-radio-group v-model="formData.templateType" @change="handleTemplateTypeChange">
                  <el-radio label="CONDITION">条件模板</el-radio>
                  <el-radio label="TRANSFORM">换算模板</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="分类" required>
                <el-select v-model="formData.scoreType" class="w-full">
                  <el-option label="学术专长(12分)" :value="0" />
                  <el-option label="综合表现(8分)" :value="1" />
                  <el-option label="学业成绩换算" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="该项总分" required>
                <el-input-number v-model="formData.templateMaxScore" :min="0" :precision="2" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="审核次数" required>
                <el-input-number v-model="formData.reviewCount" :min="1" :max="3" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- ✅ 新增: 仅 TRANSFORM 模板显示输入单位 -->
          <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="输入单位" :required="formData.templateType === 'TRANSFORM'">
                  <el-input 
                    v-model="formData.inputUnit" 
                    :disabled="formData.templateType === 'CONDITION'"
                    :placeholder="formData.templateType === 'CONDITION' ? '条件模板默认为分' : '如: GPA、小时、次数'"
                    class="w-1/3"
                  />
                  <span v-if="formData.templateType === 'CONDITION'" class="text-xs text-gray-500 ml-2">
                    条件模板固定使用"分"作为单位
                  </span>
                  <span v-else class="text-xs text-gray-500 ml-2">
                    学生提交申请时的输入单位
                  </span>
                </el-form-item>
              </el-col>
            </el-row>

          <el-form-item label="说明">
            <el-input v-model="formData.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 规则配置 -->
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">规则配置</span>
            <el-button type="primary" size="small" @click="addRule">添加规则</el-button>
          </div>
        </template>

        <el-table :data="formData.rules" border class="rule-table">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">
              <span class="font-bold">{{ $index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="绑定属性" min-width="350">
            <template #default="{ row }">
              <el-cascader
                v-model="row.selectedAttributes"
                :options="attributeCascaderOptions"
                :props="cascaderProps"
                placeholder="请选择属性"
                @change="handleAttributeChange(row)"
                clearable
                collapse-tags
                collapse-tags-tooltip
                class="w-full"
                size="small"
              />
              
              <div v-if="row.attributeIds && row.attributeIds.length > 0" class="mt-1">
                <el-tag
                  v-for="attrId in row.attributeIds"
                  :key="attrId"
                  size="small"
                  closable
                  @close="removeAttribute(row, attrId)"
                  class="mr-1"
                >
                  {{ getAttributeLabel(attrId) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            v-if="formData.templateType === 'CONDITION'" 
            label="规则分数" 
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <el-input-number
                v-model="row.ruleScore"
                :min="0"
                :max="formData.templateMaxScore"
                :precision="2"
                size="small"
                class="w-full"
              />
            </template>
          </el-table-column>

          <el-table-column label="优先级" width="100" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.priority"
                :min="0"
                size="small"
                class="w-full"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeRule($index)"
                icon="Delete"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="模板详情" width="70%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模板名称">{{ detailData.templateName }}</el-descriptions-item>
        <el-descriptions-item label="模板类型">
          <el-tag :type="detailData.templateType === 'CONDITION' ? 'success' : 'warning'">
            {{ detailData.templateType === 'CONDITION' ? '条件模板' : '换算模板' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分类">{{ getScoreTypeText(detailData.scoreType) }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ detailData.templateMaxScore }}</el-descriptions-item>
        <!-- ✅ 新增: 显示输入单位 -->
        <el-descriptions-item 
          v-if="detailData.templateType === 'TRANSFORM'" 
          label="输入单位"
        >
          <el-tag size="small" type="info">{{ detailData.inputUnit || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核次数">{{ detailData.reviewCount }}</el-descriptions-item>
        <el-descriptions-item label="说明" :span="2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>规则列表</el-divider>
      <div v-for="(rule, index) in detailData.rules" :key="index" class="mb-4 p-4 border rounded">
        <div class="font-bold mb-2">
          规则 {{ index + 1 }}
          <span v-if="detailData.templateType === 'CONDITION'" class="text-primary">
            (分数: {{ rule.ruleScore }})
          </span>
          <span class="text-gray-500">(优先级: {{ rule.priority }})</span>
        </div>

        <div v-if="rule.attributes && rule.attributes.length > 0" class="mt-2">
          <div class="text-sm text-gray-600 mb-1">绑定属性:</div>
          <el-table :data="rule.attributes" border size="small">
            <el-table-column prop="attributeCode" label="属性代码" width="150" />
            <el-table-column prop="attributeValue" label="属性值/公式" />
            
            <el-table-column v-if="detailData.templateType === 'TRANSFORM'" label="范围" width="150">
              <template #default="{ row }">
                <span v-if="row.inputMin !== undefined && row.inputMax !== undefined">
                  {{ formatRange(row) }}
                </span>
              </template>
            </el-table-column>

            <!-- ✅ 删除单位列 -->
            
            <el-table-column prop="description" label="说明" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Delete } from '@element-plus/icons-vue'
  import {
    getTemplateList,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateDetail,
    type BonusTemplate
  } from '@/api/components/apiTemplate'
  import {
    type RuleAttribute,
    getAttributesByType
  } from '@/api/components/apiAttribute'
  
const templateList = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const availableAttributes = ref<RuleAttribute[]>([])

const formData = reactive<BonusTemplate>({
  templateName: '',
  templateType: 'CONDITION',
  scoreType: 0,
  templateMaxScore: 0,
  inputUnit: '',  // ✅ 新增
  description: '',
  reviewCount: 1,
  rules: []
})

const detailData = ref<any>({ rules: [] })

const getScoreTypeText = (scoreType: number) => {
  const map: Record<number, string> = {
    0: '学术专长(12分)',
    1: '综合表现(8分)',
    2: '学业成绩换算'
  }
  return map[scoreType] || '未知类型'
}

const getScoreTypeColor = (scoreType: number) => {
  const map: Record<number, string> = {
    0: 'primary',
    1: 'success',
    2: 'warning'
  }
  return map[scoreType] || 'info'
}

// ✅ 级联选择器配置
const cascaderProps = {
  multiple: true,
  checkStrictly: false,
  value: 'value',
  label: 'label',
  children: 'children',
  emitPath: false
}

// ✅ 生成级联选择器选项 (树形结构)
const attributeCascaderOptions = computed(() => {
  const groupMap = new Map<string, any>()

  availableAttributes.value.forEach(attr => {
    if (!groupMap.has(attr.attributeCode)) {
      groupMap.set(attr.attributeCode, {
        value: attr.attributeCode,
        label: attr.attributeCode,
        attributeType: attr.attributeType,
        isChild: false,
        children: []
      })
    }

    groupMap.get(attr.attributeCode)!.children.push({
      value: attr.id,
      label: attr.attributeValue,
      attributeType: attr.attributeType,
      attributeCode: attr.attributeCode,
      isChild: true
    })
  })

  return Array.from(groupMap.values())
})

// ✅ 处理属性选择变化
const handleAttributeChange = (rule: any) => {
  if (!rule.selectedAttributes) {
    rule.attributeIds = []
    return
  }

  // selectedAttributes 是一个数组,包含所有选中的叶子节点的 value
  rule.attributeIds = rule.selectedAttributes.filter((id: any) => typeof id === 'number')
}

// ✅ 移除单个属性
const removeAttribute = (rule: any, attrId: number) => {
  if (rule.attributeIds) {
    const index = rule.attributeIds.indexOf(attrId)
    if (index > -1) {
      rule.attributeIds.splice(index, 1)
    }
  }
  
  if (rule.selectedAttributes) {
    const index = rule.selectedAttributes.indexOf(attrId)
    if (index > -1) {
      rule.selectedAttributes.splice(index, 1)
    }
  }
}

// ✅ 获取属性标签
const getAttributeLabel = (attrId: number) => {
  const attr = availableAttributes.value.find(a => a.id === attrId)
  return attr ? `${attr.attributeCode}: ${attr.attributeValue}` : ''
}

// ✅ 加载属性列表
const loadAttributes = async () => {
  try {
    const response = await getAttributesByType(formData.templateType)
    if (response.code === 200) {
      availableAttributes.value = response.data
    }
  } catch (error) {
    console.error('加载属性失败:', error)
  }
}

// ✅ 模板类型改变时重新加载属性
const handleTemplateTypeChange = () => {
  formData.rules.forEach(rule => {
    rule.attributeIds = []
    rule.selectedAttributes = []
  })
  
  // ✅ 根据模板类型设置默认单位
  if (formData.templateType === 'CONDITION') {
    formData.inputUnit = '分'  // CONDITION 模板默认为 '分'
  } else {
    formData.inputUnit = ''    // TRANSFORM 模板清空,等待用户输入
  }
  
  loadAttributes()
}

// ✅ 添加规则
const addRule = () => {
  formData.rules.push({
    ruleType: formData.templateType,
    ruleScore: formData.templateType === 'CONDITION' ? 0 : undefined,
    priority: formData.rules.length,
    attributeIds: [],
    selectedAttributes: []
  })
}

const removeRule = (index: number) => {
  formData.rules.splice(index, 1)
}

// ✅ 提交
const handleSubmit = async () => {
  if (!formData.templateName || formData.templateMaxScore <= 0) {
    ElMessage.warning('请填写完整的模板信息')
    return
  }
  // ✅ TRANSFORM 模板必须填写单位
  if (formData.templateType === 'TRANSFORM' && !formData.inputUnit) {
    ElMessage.warning('换算模板必须设置输入单位')
    return
  }

  if (formData.rules.length === 0) {
    ElMessage.warning('请至少添加一条规则')
    return
  }

  if (formData.templateType === 'CONDITION') {
    const hasInvalidScore = formData.rules.some(r => !r.ruleScore || r.ruleScore <= 0)
    if (hasInvalidScore) {
      ElMessage.warning('条件模板的规则必须设置分数')
      return
    }
  }

  const hasNoAttributes = formData.rules.some(r => !r.attributeIds || r.attributeIds.length === 0)
  if (hasNoAttributes) {
    ElMessage.warning('每个规则至少要绑定一个属性')
    return
  }

  try {
    // 提交前清理 selectedAttributes 字段
    const submitData = {
      ...formData,
      rules: formData.rules.map(({ selectedAttributes, ...rule }) => rule)
    }

    let response
    if (isEdit.value) {
      response = await updateTemplate(editingId.value, submitData)
    } else {
      response = await createTemplate(submitData)
    }

    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadTemplates()
    } else {
      ElMessage.error(response.msg || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请检查网络或联系管理员')
  }
}

// ✅ 编辑
const openEditDialog = async (id: number) => {
  const response = await getTemplateDetail(id)
  if (response.code === 200) {
    isEdit.value = true
    editingId.value = id

    const data = response.data
    Object.assign(formData, {
      templateName: data.templateName,
      templateType: data.templateType,
      scoreType: data.scoreType,
      templateMaxScore: data.templateMaxScore,
      inputUnit: data.inputUnit || '',  // ✅ 添加单位
      description: data.description,
      reviewCount: data.reviewCount,
      rules: data.rules.map((r: any) => ({
        id: r.id,
        ruleType: r.ruleType,
        ruleScore: r.ruleScore,
        priority: r.priority,
        attributeIds: r.attributeIds || [],
        selectedAttributes: r.attributeIds || []
      }))
    })

    await loadAttributes()
    dialogVisible.value = true
  }
}

const loadTemplates = async () => {
  const response = await getTemplateList()
  if (response.code === 200) {
    templateList.value = response.data
  }
}

// ✅ 创建模板时初始化单位
const openDialog = async () => {
  isEdit.value = false
  editingId.value = 0
  Object.assign(formData, {
    templateName: '',
    templateType: 'CONDITION',
    scoreType: 0,
    templateMaxScore: 0,
    inputUnit: '分',  // ✅ 默认为 '分'
    description: '',
    reviewCount: 1,
    rules: []
  })
  await loadAttributes()
  dialogVisible.value = true
}

// ✅ 格式化范围显示
const formatRange = (attr: any) => {
  if (!attr.inputMin || !attr.inputMax) return '-'
  const left = attr.inputInterval === 'OPEN' || attr.inputInterval === 'LEFT_OPEN' ? '(' : '['
  const right = attr.inputInterval === 'OPEN' || attr.inputInterval === 'RIGHT_OPEN' ? ')' : ']'
  return `${left}${attr.inputMin}, ${attr.inputMax}${right}`
}

const viewDetail = async (id: number) => {
  const response = await getTemplateDetail(id)
  if (response.code === 200) {
    detailData.value = response.data
    detailDialogVisible.value = true
  }
}


const handleDelete = async (id: number) => {
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
.rule-table {
  margin-top: 16px;
}

.rule-table :deep(.el-table__body-wrapper) {
  min-height: 200px;
}

.cascader-node {
  display: flex;
  align-items: center;
  width: 100%;
}

.font-bold {
  font-weight: 600;
}
</style>