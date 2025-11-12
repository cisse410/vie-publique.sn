<template>
  <div class="search-bar relative">
    <div class="relative">
      <input
        :value="modelValue"
        @input="handleInput"
        type="text"
        :placeholder="placeholder"
        class="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />

      <!-- Icône de recherche -->
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>

      <!-- Bouton clear -->
      <button
        v-if="modelValue"
        @click="clear"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        title="Effacer"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Rechercher...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  emit('update:modelValue', input.value)
}

const clear = () => {
  emit('update:modelValue', '')
}
</script>
