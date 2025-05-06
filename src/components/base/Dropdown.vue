<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="relative inline-block text-left min-w-30">
    <div class="max-w-xs">
      <button
        ref="dropdownButton"
        @click="toggleDropdown"
        class="inline-flex w-full justify-between px-6 py-1 text-xs truncate max-w-80 styled-element hoverable-sm"
        :style="{ backgroundColor: color }"
      >
        <div class="flex items-center space-x-2 truncate">
          {{ selectedItem }}
        </div>
        <ChevronDownIcon class="-mr-1 h-5 w-5 text-black" aria-hidden="true" />
      </button>
    </div>
    <Teleport to="body">
      <transition
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
          <div class="py-0.5 max-h-60 overflow-y-auto">
            <DropdownMenuItem
              v-for="item in items"
              :key="item.name"
              :item="item"
              :selectedItem="selectedItem"
              :color="color"
              @select="select"
            />
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import DropdownMenuItem from './DropdownMenuItem.vue'

export interface dropdownItem {
  name: string
  data?: string
  children?: dropdownItem[]
}

interface Props {
  items: dropdownItem[]
  dropdownName?: string
  color?: string
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  dropdownName: 'Options',
  color: 'white',
  modelValue: undefined
})

const emit = defineEmits<{
  (e: 'selectedItem', item: dropdownItem): void
  (e: 'update:modelValue', value: string): void
}>()

const selectedItem = computed({
  get: () => {
    if (props.modelValue === '') return props.dropdownName
    return props.modelValue || props.dropdownName
  },
  set: (value) => emit('update:modelValue', value)
})

const isOpen = ref(false)
const dropdownButton = ref<HTMLElement | null>(null)
const dropdownContent = ref<HTMLElement | null>(null)

const dropdownStyles = ref({
  top: '0px',
  left: '0px',
  width: 'auto',
  backgroundColor: props.color
})

const select = (item: dropdownItem) => {
  emit('update:modelValue', item.name)
  isOpen.value = false
  emit('selectedItem', item)
}

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

// Watch for changes in items array only when necessary
watch(
  () => props.items,
  (newItems) => {
    const currentValue = props.modelValue || selectedItem.value
    if (currentValue !== props.dropdownName && !newItems.some((item) => item.name === currentValue)) {
      emit('update:modelValue', '')
      emit('selectedItem', { name: props.dropdownName, data: '' })
    }
  }
)
</script>