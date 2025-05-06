<template>
  <div class="styled-element p-4">
    <div class="h-[600px] w-full">
      <Bar
        v-if="chartData"
        :data="chartData"
        :options="chartOptions"
        ref="chartRef"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import type { StatisticData } from '../types/StatisticData'
import { colorManager } from '../utils/colorUtils'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
)

const props = defineProps<{
  statistics: StatisticData[]
}>()

const chartOptions = computed(() => {
  // Get date range to determine if showing daily data
  const dates = props.statistics
    .filter(stat => stat.date)
    .map(stat => new Date(stat.date!))
    .sort((a, b) => a.getTime() - b.getTime())

  const monthsDiff = dates.length ? 
    (dates[dates.length - 1].getFullYear() - dates[0].getFullYear()) * 12 
    + dates[dates.length - 1].getMonth() - dates[0].getMonth()
    : 0

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `Tool Usage ${monthsDiff <= 1 ? 'by Day' : 'by Month'}`,
        font: {
          size: 14
        },
        padding: 10
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  }
})

const chartData = computed(() => {
  // Get unique dates and sort them
  const dates = props.statistics
    .filter(stat => stat.date)
    .map(stat => new Date(stat.date!))
    .sort((a, b) => a.getTime() - b.getTime())

  // If no dates, return empty data
  if (dates.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Calculate date range
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 
    + lastDate.getMonth() - firstDate.getMonth()

  // Determine if we should show daily or monthly data
  const showDailyData = monthsDiff <= 1

  // Group data by date/month and tool
  const dataByTime = new Map<string, Map<string, number>>()
  const toolSet = new Set<string>()
  
  props.statistics.forEach(stat => {
    if (!stat.date || !stat.toolName) return
    
    const date = new Date(stat.date)
    const timeKey = showDailyData 
      ? date.toISOString().split('T')[0] // YYYY-MM-DD
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
    
    if (!dataByTime.has(timeKey)) {
      dataByTime.set(timeKey, new Map())
    }
    
    const timeData = dataByTime.get(timeKey)!
    const currentCount = timeData.get(stat.toolName) || 0
    timeData.set(stat.toolName, currentCount + 1)
    toolSet.add(stat.toolName)
  })

  // Sort time periods chronologically
  const sortedTimes = Array.from(dataByTime.keys()).sort()
  
  // Get colors for tools
  const tools = Array.from(toolSet)
  const colors = colorManager.getMostDistinctColors(tools.length)
  
  return {
    labels: sortedTimes.map(time => {
      if (showDailyData) {
        const [, month, day] = time.split('-')  // Use empty destructuring for unused year
        return `${month}/${day}`
      } else {
        const [year, month] = time.split('-')
        return `${month}/${year}`
      }
    }),
    datasets: tools.map((tool, index) => ({
      label: tool,
      data: sortedTimes.map(time => 
        dataByTime.get(time)?.get(tool) || 0
      ),
      backgroundColor: colors[index],
      borderColor: colors[index],
      borderWidth: 1
    }))
  }
})

const chartRef = ref(null)

// Debounce function
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Watch for changes in statistics prop with debounce
watch(() => chartData.value, 
  debounce(() => {
    if (chartRef.value) {
      // @ts-ignore - chart exists on the component instance
      chartRef.value.chart.update('none')
    }
  }, 250), // 250ms delay
  { deep: true }
)
</script>