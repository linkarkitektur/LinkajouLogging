<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StatisticData } from '../types/StatisticData'
import InputText from './base/InputText.vue'
import Dropdown from './base/Dropdown.vue'
import DropdownSearchable from './base/DropdownSearchable.vue'
import type { dropdownItem } from './base/Dropdown.vue'
import { baseColors } from '../utils/colorUtils'

const props = defineProps<{
  statistics: StatisticData[]
}>()

const emit = defineEmits<{
  'update:filtered': [statistics: StatisticData[]]
}>()

const searchQuery = ref('')
const selectedTool = ref('')
const selectedProject = ref('')

const selectedYear = ref('')
const selectedMonth = ref('')

// Time-based filtering options
const yearsAndMonths = computed(() => {
  const years = new Set<string>()
  const months = new Set<string>()
  
  props.statistics.forEach(stat => {
    if (stat.date) {
      const date = new Date(stat.date)
      years.add(date.getFullYear().toString())
      months.add((date.getMonth() + 1).toString().padStart(2, '0'))
    }
  })
  
  return {
    years: Array.from(years).sort().reverse(),
    months: Array.from(months).sort()
  }
})

const years = computed(() => {
  return [
    { name: 'All Years', data: '' },
    ...yearsAndMonths.value.years.map(year => ({
      name: year,
      data: year
    }))
  ]
})

const months = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  return [
    { name: 'All Months', data: '' },
    ...yearsAndMonths.value.months.map(month => ({
      name: monthNames[parseInt(month) - 1],
      data: month
    }))
  ]
})

const tools = computed(() => {
  const toolList = [...new Set(props.statistics.map(stat => stat.toolName))].sort()
  return [
    { name: 'All Tools', data: '' },
    ...toolList.map(tool => ({ name: tool || '', data: tool || '' }))
  ]
})

const projects = computed(() => {
  const projectList = [...new Set(props.statistics.map(stat => stat.project))].sort()
  return [
    { name: 'All Projects', data: '' },
    ...projectList.map(project => ({ name: project || '', data: project || '' }))
  ]
})

const handleToolSelect = (item: dropdownItem) => {
  selectedTool.value = item.data || ''
}

const handleProjectSelect = (item: dropdownItem) => {
  selectedProject.value = item.data || ''
}

const handleYearSelect = (item: dropdownItem) => {
  selectedYear.value = item.data || ''
}

const handleMonthSelect = (item: dropdownItem) => {
  selectedMonth.value = item.data || ''
}

const filteredStatistics = computed(() => {
  return props.statistics.filter(stat => {
    const matchesSearch = !searchQuery.value || 
      Object.values(stat).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    
    // Time-based filtering
    let matchesTime = true
    if (stat.date) {
      const date = new Date(stat.date)
      if (selectedYear.value && date.getFullYear().toString() !== selectedYear.value) {
        matchesTime = false
      }
      if (selectedMonth.value && (date.getMonth() + 1).toString().padStart(2, '0') !== selectedMonth.value) {
        matchesTime = false
      }
    }
    
    const matchesTool = !selectedTool.value || 
      stat.toolName?.toLowerCase() === selectedTool.value.toLowerCase()
    
    const matchesProject = !selectedProject.value || 
      stat.project?.toLowerCase() === selectedProject.value.toLowerCase()

    return matchesSearch && matchesTime && matchesTool && matchesProject
  })
})

// Watch for changes and emit filtered results
watch(
  [searchQuery, selectedYear, selectedMonth, selectedTool, selectedProject],
  () => {
    emit('update:filtered', filteredStatistics.value)
  },
  { immediate: true }
)
</script>

<template>
  <div class="styled-element p-3 space-y-3">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      <!-- Search input -->
      <div class="space-y-1">
        <label class="text-sm block">Search</label>
        <InputText
          id="search"
          v-model="searchQuery"
          placeholder="Search all fields..."
        />
      </div>

      <!-- Year filter -->
      <div class="space-y-1">
        <label class="text-sm block">Year</label>
        <Dropdown
          :items="years"
          v-model="selectedYear"
          dropdownName="All Years"
          :color="baseColors.primaryYellow"
          @selectedItem="handleYearSelect"
        />
      </div>

      <!-- Month filter -->
      <div class="space-y-1">
        <label class="text-sm block">Month</label>
        <Dropdown
          :items="months"
          v-model="selectedMonth"
          dropdownName="All Months"
          :color="baseColors.primaryGreen"
          @selectedItem="handleMonthSelect"
        />
      </div>

      <!-- Tool filter -->
      <div class="space-y-1">
        <label class="text-sm block">Tool</label>
        <DropdownSearchable
          :items="tools"
          v-model="selectedTool"
          dropdownName="All Tools"
          :color="baseColors.primaryRed"
          @selectedItem="handleToolSelect"
        />
      </div>

      <!-- Project filter -->
      <div class="space-y-1">
        <label class="text-sm block">Project</label>
        <DropdownSearchable
          :items="projects"
          v-model="selectedProject"
          dropdownName="All Projects"
          :color="baseColors.primaryGrey"
          @selectedItem="handleProjectSelect"
        />
      </div>
    </div>
  </div>
</template>