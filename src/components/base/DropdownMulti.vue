<template>
  <div class="relative inline-block text-left min-w-30">
    <div class="max-w-xs">
      <button
        ref="dropdownButton"
        @click="toggleDropdown"
        class="group inline-flex items-center justify-center text-sm styled-element p-1 hoverable-sm"
        :style="{ backgroundColor: props.color }"
      >
        <span>{{ displayName }}</span>
        <span class="ml-1 border-l border-black p-1 text-xs styled-data">
          {{ selectedCount === 0 ? 'All' : selectedCount }}
        </span>
        <ChevronDownIcon class="mr-1 ml-1 h-4 w-4 text-black" aria-hidden="true" />
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdownContent"
          class="fixed z-50 origin-top-left styled-element"
          :style="dropdownStyles"
        >
          <form class="space-y-4 p-1">
            <div
              v-for="(option, optionIdx) in options"
              :key="option.value"
              class="flex items-center"
            >
              <CheckBox
                :id="`filter-${filterName}-${optionIdx}`"
                :name="`${filterName}[]`"
                :value="option.value"
                :checked="option.selected"
                @update:checked="toggleSelection(optionIdx)"
              />
              <label
                :for="`filter-${filterName}-${optionIdx}`"
                class="pl-2 text-sm text-gray-700 hover:opacity-80"
              >
                {{ option.label }}
              </label>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import CheckBox from './CheckBox.vue'

export interface Option {
  label: string
  value: string
  selected: boolean
}

// Props
interface Props {
  filterName: string
  displayName: string
  options: Option[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'white'
})

const emit = defineEmits<{
  'update:options': [Option[]]
}>()

// Refs
const isOpen = ref(false)
const dropdownButton = ref<HTMLElement | null>(null)
const dropdownContent = ref<HTMLElement | null>(null)

// Computed
const selectedCount = computed(() => 
  props.options.filter(option => option.selected).length
)

const dropdownStyles = ref({
  top: '0px',
  left: '0px',
  width: 'auto',
  backgroundColor: props.color
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      if (dropdownButton.value) {
        const rect = dropdownButton.value.getBoundingClientRect()
        dropdownStyles.value = {
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          backgroundColor: props.color
        }
      }
    })
  }
}

const toggleSelection = (index: number) => {
  const updatedOptions = [...props.options]
  updatedOptions[index].selected = !updatedOptions[index].selected
  emit('update:options', updatedOptions)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    dropdownButton.value &&
    !dropdownButton.value.contains(target) &&
    dropdownContent.value &&
    !dropdownContent.value.contains(target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>