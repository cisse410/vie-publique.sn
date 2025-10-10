<template>
  <ClientOnly :placeholder="loadingPlaceholder">
    <div class="pdf-document-wrapper">
      <!-- <div v-if="showToolbar" class="pdf-toolbar">
        <div class="toolbar-left">
          <button
            :disabled="currentPage <= 1"
            class="toolbar-btn"
            aria-label="Page précédente"
            @click="currentPage--"
          >
            <span class="i-heroicons-chevron-left"></span>
          </button>

          <span class="page-counter"> {{ currentPage }} / {{ totalPages || '...' }} </span>

          <button
            :disabled="currentPage >= totalPages"
            class="toolbar-btn"
            aria-label="Page suivante"
            @click="currentPage++"
          >
            <span class="i-heroicons-chevron-right"></span>
          </button>
        </div>

        <div class="toolbar-center">
          <button class="toolbar-btn" aria-label="Zoom arrière" @click="zoomOut">
            <span class="i-heroicons-minus"></span>
          </button>

          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>

          <button class="toolbar-btn" aria-label="Zoom avant" @click="zoomIn">
            <span class="i-heroicons-plus"></span>
          </button>
        </div>

        <div class="toolbar-right">
          <button class="toolbar-btn" aria-label="Rotation" @click="rotate">
            <span class="i-heroicons-arrow-path"></span>
          </button>

          <a v-if="showDownload" :href="src" download class="toolbar-btn" aria-label="Télécharger">
            <span class="i-heroicons-arrow-down-tray"></span>
          </a>
        </div>
      </div> -->

      <!-- Viewer PDF -->
      <div class="pdf-viewer-container" :style="containerStyle">
        <VPdfViewer
          :src="src"
          :page="currentPage"
          :scale="scale"
          :rotation="rotation"
          @document-loaded="handleDocumentLoaded"
          @page-loaded="handlePageLoaded"
          @error="handleError"
        />
      </div>

      <!-- Message d'erreur -->
      <UAlert
        v-if="errorMessage"
        title="Erreur de chargement"
        :description="errorMessage"
        color="red"
        icon="i-heroicons-exclamation-triangle"
        class="mt-4"
      />
    </div>

    <template #fallback>
      <div class="pdf-loading">
        <div class="loading-spinner"></div>
        <p>{{ loadingPlaceholder }}</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { VPdfViewer } from '@vue-pdf-viewer/viewer'

interface Props {
  src: string
  height?: string
  width?: string
  showToolbar?: boolean
  showDownload?: boolean
  initialScale?: number
  loadingPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '700px',
  width: '100%',
  showToolbar: true,
  showDownload: true,
  initialScale: 1.0,
  loadingPlaceholder: 'Chargement du document PDF...',
})

// États
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(props.initialScale)
const rotation = ref(0)
const errorMessage = ref<string | null>(null)

// Style dynamique du conteneur
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))

// Handlers
const handleDocumentLoaded = (pdf: any) => {
  totalPages.value = pdf.numPages
  console.log('📄 PDF chargé:', pdf.numPages, 'pages')
}

const handlePageLoaded = (pageData: any) => {
  console.log('✅ Page', pageData.pageNumber, 'chargée')
}

const handleError = (error: any) => {
  errorMessage.value = error?.message || 'Impossible de charger le PDF'
  console.error('❌ Erreur PDF:', error)
}

// Actions toolbar
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 3.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360
}

// Navigation au clavier
onMounted(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return // Ne pas intercepter si on est dans un input
    }

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentPage.value < totalPages.value) currentPage.value++
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentPage.value > 1) currentPage.value--
    }
    if (e.key === '+' || e.key === '=') {
      zoomIn()
    }
    if (e.key === '-') {
      zoomOut()
    }
  }

  window.addEventListener('keydown', handleKeyPress)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
  })
})

// Exposer certaines méthodes pour usage externe (optionnel)
defineExpose({
  goToPage: (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  },
  resetZoom: () => {
    scale.value = props.initialScale
  },
  getTotalPages: () => totalPages.value,
})
</script>

<style scoped>
.pdf-document-wrapper {
  @apply w-full;
}

.pdf-toolbar {
  @apply flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800;
  @apply mb-4;
  @apply flex-wrap;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  @apply flex items-center gap-2;
}

.toolbar-btn {
  @apply flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600;
  @apply min-w-[40px];
}

.page-counter,
.zoom-level {
  @apply rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200;
  @apply min-w-[80px] text-center;
}

.pdf-viewer-container {
  @apply overflow-auto rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900;
  @apply flex items-center justify-center;
}

.pdf-loading {
  @apply flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-12 dark:border-gray-700 dark:bg-gray-800;
}

.loading-spinner {
  @apply border-t-primary-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600;
}

/* Responsive */
@media (max-width: 768px) {
  .pdf-toolbar {
    @apply flex-col gap-3;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    @apply w-full justify-center;
  }
}

/* Masquer le watermark de @vue-pdf-viewer */
:deep(.vue-pdf-viewer-watermark),
:deep([class*='watermark']),
:deep([class*='powered-by']) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
</style>
