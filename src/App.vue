<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { StatisticData } from './types/StatisticData'
import StatisticsTable from './components/StatisticsTable.vue'
import StatisticsFilters from './components/StatisticsFilters.vue'
import StatisticsChart from './components/StatisticsChart.vue'
import Papa from 'papaparse'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase/config'

const statistics = ref<StatisticData[]>([])
const filteredStatistics = ref<StatisticData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const parseCsvData = async () => {
  try {
    const allData: StatisticData[] = []
    let processedRows = 0
    const batchSize = 1000

    // Process each CSV part sequentially
    for (let partNum = 1; partNum <= 6; partNum++) {
      console.log(`Processing part ${partNum}...`)
      const response = await fetch(`/src/data/OldStats.csv_part${partNum}.csv`)
      const csvText = await response.text()
      
      await new Promise<void>((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          chunk: (chunkResult: { data: any[] }) => {
            try {
              // Process rows in smaller batches to prevent stack overflow
              for (const row of chunkResult.data) {
                if (!row || typeof row !== 'object') continue

                const date = row.date ? new Date(row.date) : null
                if (date && isNaN(date.getTime())) continue

                // Simplified string processing
                const processString = (str: string | null | undefined) => 
                  (str?.trim() || null)

                const processEmail = (str: string | null | undefined) =>
                  (str?.trim().toLowerCase() || null)

                allData.push({
                  date: date ? date.toISOString() : null,
                  event: processString(row.event),
                  eventDetails: processString(row.eventDetails),
                  grasshopperEmail: processEmail(row.grasshopperEmail),
                  grasshopperFilePath: processString(row.grasshopperFilePath),
                  grasshopperUserName: processString(row.grasshopperUserName),
                  linkajouComponents: processString(row.linkajouComponents),
                  linkajouVersion: processString(row.linkajouVersion),
                  pluginsDependencies: processString(row.pluginsDependencies),
                  project: processString(row.project),
                  projectNumber: processString(row.projectNumber),
                  rhinoFilePath: processString(row.rhinoFilePath),
                  toolName: processString(row.toolName),
                  toolVersion: processString(row.toolVersion),
                  winLogin: processEmail(row.winLogin)
                })

                processedRows++
              }

              if (processedRows % batchSize === 0) {
                console.log(`Processed ${processedRows} rows...`)
              }
            } catch (err) {
              console.error('Error processing chunk:', err)
            }
          },
          complete: () => {
            console.log(`Finished processing part ${partNum} (${processedRows} total rows)`)
            resolve()
          },
          error: (error: Error) => {
            console.error(`Error parsing CSV part ${partNum}:`, error)
            reject(error)
          }
        })
      })
    }

    return allData
  } catch (e) {
    console.error('Error reading CSV parts:', e)
    throw e
  }
}

const fetchStatistics = async () => {
  try {
    let firebaseData: StatisticData[] = []
    const csvData = await parseCsvData()

    try {
      const querySnapshot = await getDocs(collection(db, 'Logging'))
      if (!querySnapshot.empty) {
        firebaseData = querySnapshot.docs.map(doc => {
          const data = doc.data() as StatisticData
          if (data.date) {
            try {
              const date = new Date(data.date)
              if (isNaN(date.getTime())) {
                console.warn(`Invalid date found for document ${doc.id}: ${data.date}`)
                data.date = null
              }
            } catch (e) {
              console.warn(`Error parsing date for document ${doc.id}: ${data.date}`)
              data.date = null
            }
          }
          return data
        })
      }
    } catch (firebaseError) {
      console.warn('Firebase fetch failed or disabled:', firebaseError)
    }

    if (!csvData || csvData.length === 0) {
      error.value = 'No statistics data found'
      loading.value = false
      return
    }

    // Using only CSV data while Firebase is disabled
    statistics.value = [...csvData, ...firebaseData]
      .filter(data => data.date !== null)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())

    loading.value = false

  } catch (e) {
    console.error('Error fetching data:', e)
    error.value = `Error loading statistics data: ${e instanceof Error ? e.message : String(e)}`
    loading.value = false
  }
}

onMounted(() => {
  fetchStatistics()
})
</script>

<template>
  <main class="min-h-screen bg-white p-4 md:p-8">
    <header class="mb-8">
      <h1 class="styled-header text-3xl mb-4">Linkajou Statistics</h1>
      <p class="styled-bread">Track usage and activity across Linkajou tools and projects.</p>
    </header>

    <div v-if="error" class="styled-element bg-red-50 p-4 mb-6">
      {{ error }}
      <button 
        @click="fetchStatistics"
        class="ml-4 styled-element px-2 py-1 text-sm hoverable-sm"
      >
        Retry
      </button>
    </div>

    <div v-if="loading" class="styled-text">
      Loading statistics...
    </div>

    <div v-else-if="!error" class="space-y-6">
      <StatisticsFilters
        :statistics="statistics"
        @update:filtered="filteredStatistics = $event"
      />
      
      <StatisticsChart 
        :statistics="filteredStatistics"
      />
      
      <StatisticsTable 
        :statistics="filteredStatistics" 
      />
    </div>
  </main>
</template>
