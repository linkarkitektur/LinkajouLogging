<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid'
import type { StatisticData } from '../types/StatisticData'
import { colorManager, getFontColorForHSL } from '../utils/colorUtils'

const props = defineProps<{
  statistics: StatisticData[]
}>()

const containerRef = ref<HTMLElement | null>(null)
const sortBy = ref<keyof StatisticData>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const toolColors = ref<Map<string, string>>(new Map())
const CHUNK_SIZE = 50; // Smaller chunks for smoother scrolling
const BUFFER_SIZE = 200; // Number of items to keep in memory

const tableHeaders: Array<{ key: keyof StatisticData, label: string }> = [
  { key: 'date', label: 'Date' },
  { key: 'event', label: 'Event' },
  { key: 'eventDetails', label: 'Details' },
  { key: 'toolName', label: 'Tool' },
  { key: 'toolVersion', label: 'Version' },
  { key: 'project', label: 'Project' },
  { key: 'projectNumber', label: 'Project #' },
  { key: 'grasshopperEmail', label: 'Email' },
  { key: 'grasshopperUserName', label: 'Username' },
  { key: 'winLogin', label: 'Windows Login' }
]

const sortedStatistics = computed(() => {
  return [...props.statistics].sort((a, b) => {
    const aValue = a[sortBy.value] ?? ''
    const bValue = b[sortBy.value] ?? ''
    
    if (sortDirection.value === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
  })
})

// Load data in chunks
const visibleChunks = ref(new Set<number>())
const loadedData = ref(new Map<number, StatisticData[]>())

const calculateVisibleChunks = () => {
  if (!containerRef.value) return;
  
  const element = containerRef.value;
  const scrollTop = element.scrollTop;
  const viewportHeight = element.clientHeight;
  
  // Calculate approximate chunks based on average row height
  const averageRowHeight = 60; // estimate for wrapped content
  const startChunk = Math.floor(scrollTop / (CHUNK_SIZE * averageRowHeight));
  const endChunk = Math.ceil((scrollTop + viewportHeight) / (CHUNK_SIZE * averageRowHeight));
  
  // Include buffer chunks
  const bufferChunks = Math.ceil(BUFFER_SIZE / CHUNK_SIZE);
  const newVisibleChunks = new Set<number>();
  
  for (let i = Math.max(0, startChunk - bufferChunks); i <= endChunk + bufferChunks; i++) {
    if (i * CHUNK_SIZE < sortedStatistics.value.length) {
      newVisibleChunks.add(i);
    }
  }
  
  // Clean up chunks that are far from viewport
  for (const chunk of loadedData.value.keys()) {
    if (!newVisibleChunks.has(chunk)) {
      loadedData.value.delete(chunk);
    }
  }
  
  visibleChunks.value = newVisibleChunks;
}

const loadVisibleChunks = () => {
  const sorted = sortedStatistics.value;
  for (const chunk of visibleChunks.value) {
    if (!loadedData.value.has(chunk)) {
      const start = chunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, sorted.length);
      const items = sorted.slice(start, end);
      loadedData.value.set(chunk, items);
    }
  }
}

// Debounce the scroll handler
let scrollTimeout: number | null = null;
const handleScroll = () => {
  if (scrollTimeout) {
    window.clearTimeout(scrollTimeout);
  }
  scrollTimeout = window.setTimeout(() => {
    calculateVisibleChunks();
    loadVisibleChunks();
  }, 16); // roughly 60fps
};

// Replace existing virtual list with our optimized version
const virtualItems = computed(() => {
  const items: StatisticData[] = [];
  const chunks = Array.from(visibleChunks.value).sort((a, b) => a - b);
  for (const chunk of chunks) {
    const chunkData = loadedData.value.get(chunk);
    if (chunkData) {
      items.push(...chunkData);
    }
  }
  return items;
});

const totalHeight = computed(() => {
  // Estimate total height based on average row height
  return sortedStatistics.value.length * 60; // Using 60px as average height for wrapped content
});

// Set up scroll handler
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll);
    nextTick(() => {
      calculateVisibleChunks();
      loadVisibleChunks();
    });
  }
});

// Watch for changes in statistics prop
watch(
  () => props.statistics,
  () => {
    loadedData.value.clear();
    nextTick(() => {
      calculateVisibleChunks();
      loadVisibleChunks();
    });
  },
  { immediate: true }
);

const getRowKey = (stat: StatisticData, index: number) => {
  return `${stat.date}-${stat.toolName}-${index}`
}

const getToolStyle = (toolName: string) => {
  if (!toolColors.value.has(toolName)) {
    toolColors.value.set(toolName, colorManager.getNextColor())
  }
  const color = toolColors.value.get(toolName)
  return {
    backgroundColor: color,
    color: getFontColorForHSL(color || '')
  }
}

watch([sortBy, sortDirection], () => {
  loadedData.value.clear()
  calculateVisibleChunks()
  loadVisibleChunks()
})
</script>

<template>
  <div class="space-y-4">
    <div class="overflow-x-auto h-[600px] relative" ref="containerRef">
      <div :style="{ height: `${totalHeight}px` }" class="relative">
        <table class="styled-table w-full text-sm absolute" style="table-layout: fixed;">
          <thead class="sticky top-0 bg-white z-10">
            <tr class="w-full">
              <th v-for="header in tableHeaders" 
                  :key="header.key"
                  class="p-2 border-b border-black text-left cursor-pointer overflow-hidden"
                  @click="sortBy = header.key; sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
              >
                <div class="flex items-center space-x-1">
                  <span class="truncate">{{ header.label }}</span>
                  <span v-if="sortBy === header.key" class="w-4 h-4 flex-shrink-0">
                    <ArrowUpIcon v-if="sortDirection === 'asc'" />
                    <ArrowDownIcon v-if="sortDirection === 'desc'" />
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stat, index) in virtualItems" 
                :key="getRowKey(stat, index)"
                :style="{ top: `${index * 60}px` }"
                class="text-sm w-full"
            >
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.date ? new Date(stat.date).toLocaleDateString() : '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.event || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.eventDetails || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">
                  <span 
                    class="px-2 py-1 rounded inline-block"
                    :style="getToolStyle(stat.toolName || '')"
                  >
                    {{ stat.toolName || '-' }}
                  </span>
                </div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.toolVersion || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.project || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.projectNumber || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.grasshopperEmail || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.grasshopperUserName || '-' }}</div>
              </td>
              <td class="p-2 border-b border-black overflow-hidden">
                <div class="break-words">{{ stat.winLogin || '-' }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>