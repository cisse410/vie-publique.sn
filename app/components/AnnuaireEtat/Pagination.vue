<template>
  <nav class="flex items-center justify-center gap-2">
    <!-- Previous button -->
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage === 1"
      :class="[
        'rounded-lg border px-3 py-2',
        currentPage === 1
          ? 'cursor-not-allowed border-gray-200 text-gray-400'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50',
      ]"
    >
      ← Précédent
    </button>

    <!-- Page numbers -->
    <div class="flex gap-1">
      <button
        v-for="page in visiblePages"
        :key="page"
        @click="goToPage(page)"
        :class="[
          'h-10 w-10 rounded-lg border font-medium',
          page === currentPage
            ? 'border-blue-500 bg-blue-500 text-white'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50',
        ]"
      >
        {{ page }}
      </button>
    </div>

    <!-- Next button -->
    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      :class="[
        'rounded-lg border px-3 py-2',
        currentPage === totalPages
          ? 'cursor-not-allowed border-gray-200 text-gray-400'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50',
      ]"
    >
      Suivant →
    </button>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  totalPages: number
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 7,
})

const emit = defineEmits<{
  'update:modelValue': [page: number]
}>()

const currentPage = computed(() => props.modelValue)

const visiblePages = computed(() => {
  const pages: number[] = []
  const { totalPages, maxVisible } = props
  const current = currentPage.value

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Calculate range around current page
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages) return
  emit('update:modelValue', page)
}
</script>
