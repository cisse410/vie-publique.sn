<template>
  <div class="decree-selector">
    <select
      :value="modelValue?.id"
      @change="handleChange"
      class="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="" disabled>Sélectionner un décret</option>
      <option
        v-for="decree in decrees"
        :key="decree.id"
        :value="decree.id"
        :class="{ 'font-bold': decree.status === 'active' }"
      >
        {{ formatDecreeLabel(decree) }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { Decree } from '~~/types/etat';
import { formatDate, formatDecreeNumber } from '~~/utils/formatters';

interface Props {
  modelValue: Decree | null
  decrees: Decree[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [decree: Decree]
}>()

const handleChange = (event: Event) => {
  const select = event.target as HTMLSelectElement
  const decreeId = parseInt(select.value)
  const decree = props.decrees.find(d => d.id === decreeId)

  if (decree) {
    emit('update:modelValue', decree)
  }
}

const formatDecreeLabel = (decree: Decree): string => {
  const date = formatDate(decree.date_publication, 'short')
  const status = decree.status === 'active' ? '✓ EN COURS' : ''
  return `${formatDecreeNumber(decree.numero)} - ${date} ${status}`
}
</script>
