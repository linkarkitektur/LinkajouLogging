<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    class="relative flex items-center justify-center whitespace-nowrap px-1.5 py-1 h-7 text-xs styled-element hoverable-xs pressable"
    @click="$emit('onClick')"
    :style="{ backgroundColor: color }"
  >
    <span class="flex items-center gap-1">
      <p>{{ text }}</p>
      <component :is="icon" class="h-4 w-4" v-if="icon" />
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  text: string
  icon?: any
  ariaLabel?: string
  color?: string
}>()

defineEmits<{
  onClick: []
}>()
</script>