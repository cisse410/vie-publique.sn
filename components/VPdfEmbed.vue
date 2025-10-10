<!-- <template>
  <ClientOnly>
    <div class="pdf-container">
      <VuePdfEmbed :source="pdfSource" :page="currentPage" @loaded="handleDocumentLoad" />

      <div class="controls">
        <button :disabled="currentPage <= 1" @click="currentPage--">Précédent</button>
        <span>{{ currentPage }} / {{ pageCount }}</span>
        <button :disabled="currentPage >= pageCount" @click="currentPage++">Suivant</button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import VuePdfEmbed from 'vue-pdf-embed'

const pdfSource = ref('/pdf/budget/2025-document-budgetaire-genre.pdf')
const currentPage = ref(1)
const pageCount = ref(0)

const handleDocumentLoad = ({ pageCount: count }) => {
  pageCount.value = count
}
</script>

<style scoped>
.pdf-container {
  max-width: 100%;
  margin: 0 auto;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
</style> -->

<!-- components/PdfViewer.vue -->
<template>
  <ClientOnly :placeholder="loadingPlaceholder">
    <div class="pdf-viewer-wrapper">
      <!-- Toolbar de contrôle personnalisé -->
      <div v-if="showControls" class="pdf-controls">
        <!-- Navigation -->
        <div class="control-group">
          <button
            :disabled="currentPage <= 1"
            class="control-btn"
            title="Page précédente"
            @click="goToPreviousPage"
          >
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div class="page-info">
            <input
              v-model.number="pageInput"
              type="number"
              min="1"
              :max="totalPages"
              class="page-input"
              @keyup.enter="goToPageInput"
            />
            <span class="page-separator">/</span>
            <span class="total-pages">{{ totalPages }}</span>
          </div>

          <button
            :disabled="currentPage >= totalPages"
            class="control-btn"
            title="Page suivante"
            @click="goToNextPage"
          >
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <!-- Zoom -->
        <div class="control-group">
          <button
            :disabled="scale <= 0.5"
            class="control-btn"
            title="Zoom arrière"
            @click="zoomOut"
          >
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </button>

          <select v-model.number="scale" class="zoom-select">
            <option :value="0.5">50%</option>
            <option :value="0.75">75%</option>
            <option :value="1">100%</option>
            <option :value="1.25">125%</option>
            <option :value="1.5">150%</option>
            <option :value="2">200%</option>
            <option :value="3">300%</option>
          </select>

          <button :disabled="scale >= 3" class="control-btn" title="Zoom avant" @click="zoomIn">
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              />
            </svg>
          </button>
        </div>

        <!-- Actions supplémentaires -->
        <div class="control-group">
          <button class="control-btn" title="Rotation horaire" @click="rotateClockwise">
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button class="control-btn" title="Ajuster à la largeur" @click="fitToWidth">
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <a
            v-if="showDownload"
            :href="src"
            download
            class="control-btn"
            title="Télécharger le PDF"
          >
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          <button class="control-btn" title="Plein écran" @click="toggleFullscreen">
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Container du PDF -->
      <div
        ref="pdfContainer"
        class="pdf-container"
        :class="{ fullscreen: isFullscreen }"
        :style="containerStyle"
      >
        <VuePdfEmbed
          ref="pdfRef"
          :source="src"
          :page="currentPage"
          :width="pdfWidth"
          :rotation="rotation"
          @rendered="handleRendered"
          @loading-failed="handleError"
          @password-requested="handlePasswordRequest"
        />
      </div>

      <!-- Message d'erreur -->
      <div v-if="errorMessage" class="error-alert">
        <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <strong>Erreur de chargement</strong>
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Dialog mot de passe -->
      <div v-if="showPasswordDialog" class="password-dialog">
        <div class="password-content">
          <h3>Ce PDF est protégé</h3>
          <p>Veuillez entrer le mot de passe pour accéder au document.</p>
          <input
            v-model="password"
            type="password"
            placeholder="Mot de passe"
            class="password-input"
            @keyup.enter="submitPassword"
          />
          <div class="password-actions">
            <button class="btn-secondary" @click="cancelPassword">Annuler</button>
            <button class="btn-primary" @click="submitPassword">Valider</button>
          </div>
        </div>
      </div>
    </div>

    <template #fallback>
      <div class="pdf-loading">
        <div class="spinner"></div>
        <p>{{ loadingPlaceholder }}</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed'

interface Props {
  src: string
  height?: string
  width?: string
  showControls?: boolean
  showDownload?: boolean
  initialScale?: number
  initialPage?: number
  loadingPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '700px',
  width: '100%',
  showControls: true,
  showDownload: true,
  initialScale: 1.0,
  initialPage: 1,
  loadingPlaceholder: 'Chargement du document PDF...',
})

// Refs
const pdfRef = ref<any>(null)
const pdfContainer = ref<HTMLElement | null>(null)

// États
const currentPage = ref(props.initialPage)
const pageInput = ref(props.initialPage)
const totalPages = ref(0)
const scale = ref(props.initialScale)
const rotation = ref(0)
const isFullscreen = ref(false)
const errorMessage = ref<string | null>(null)
const showPasswordDialog = ref(false)
const password = ref('')
const pdfWidth = ref<number | undefined>(undefined)

// Computed
const containerStyle = computed(() => ({
  height: props.height,
  width: props.width,
}))

// Watchers
watch(currentPage, (newPage) => {
  pageInput.value = newPage
})

watch(scale, () => {
  updatePdfWidth()
})

// Handlers
const handleRendered = (pdf: any) => {
  if (pdf && pdf.numPages) {
    totalPages.value = pdf.numPages
    updatePdfWidth()
    console.log('✅ PDF chargé:', pdf.numPages, 'pages')
  }
}

const handleError = (error: any) => {
  errorMessage.value = error?.message || 'Impossible de charger le PDF'
  console.error('❌ Erreur PDF:', error)
}

const handlePasswordRequest = () => {
  showPasswordDialog.value = true
}

// Navigation
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToPageInput = () => {
  const page = pageInput.value
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = currentPage.value
  }
}

// Zoom
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 3.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

const fitToWidth = () => {
  if (pdfContainer.value) {
    const containerWidth = pdfContainer.value.clientWidth
    pdfWidth.value = containerWidth - 40 // Padding
    scale.value = 1.0
  }
}

const updatePdfWidth = () => {
  if (pdfContainer.value) {
    const baseWidth = pdfContainer.value.clientWidth - 40
    pdfWidth.value = baseWidth * scale.value
  }
}

// Rotation
const rotateClockwise = () => {
  rotation.value = (rotation.value + 90) % 360
}

// Fullscreen
const toggleFullscreen = () => {
  if (!document.fullscreenElement && pdfContainer.value) {
    pdfContainer.value.requestFullscreen()
    isFullscreen.value = true
  } else if (document.fullscreenElement) {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Password
const submitPassword = () => {
  // VuePdfEmbed gérera le mot de passe automatiquement
  showPasswordDialog.value = false
  password.value = ''
}

const cancelPassword = () => {
  showPasswordDialog.value = false
  password.value = ''
  errorMessage.value = 'Chargement annulé - mot de passe requis'
}

// Navigation clavier
onMounted(() => {
  updatePdfWidth()

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        goToNextPage()
        break
      case 'ArrowLeft':
      case 'PageUp':
        goToPreviousPage()
        break
      case '+':
      case '=':
        zoomIn()
        break
      case '-':
        zoomOut()
        break
      case 'r':
      case 'R':
        rotateClockwise()
        break
      case 'f':
      case 'F':
        toggleFullscreen()
        break
    }
  }

  const handleResize = () => {
    updatePdfWidth()
  }

  window.addEventListener('keydown', handleKeyPress)
  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
    window.removeEventListener('resize', handleResize)
  })
})

// Exposer des méthodes
defineExpose({
  goToPage: (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  },
  nextPage: goToNextPage,
  previousPage: goToPreviousPage,
  zoomIn,
  zoomOut,
  rotate: rotateClockwise,
  resetZoom: () => {
    scale.value = props.initialScale
  },
  getTotalPages: () => totalPages.value,
  getCurrentPage: () => currentPage.value,
})
</script>

<style scoped>
.pdf-viewer-wrapper {
  @apply w-full;
}

/* Toolbar de contrôle */
.pdf-controls {
  @apply mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800;
}

.control-group {
  @apply flex items-center gap-2;
}

.control-btn {
  @apply flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600;
}

.icon {
  @apply h-5 w-5;
}

/* Page info */
.page-info {
  @apply flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 dark:bg-gray-700;
}

.page-input {
  @apply w-12 rounded border border-gray-300 bg-white px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200;
}

.page-input::-webkit-inner-spin-button,
.page-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-separator {
  @apply text-gray-500 dark:text-gray-400;
}

.total-pages {
  @apply font-medium text-gray-700 dark:text-gray-200;
}

/* Zoom select */
.zoom-select {
  @apply rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200;
}

/* Container PDF */
.pdf-container {
  @apply relative overflow-auto rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900;
  @apply flex justify-center p-4;
}

.pdf-container.fullscreen {
  @apply fixed inset-0 z-50 h-screen w-screen;
}

/* Error alert */
.error-alert {
  @apply mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20;
}

.error-icon {
  @apply h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400;
}

.error-alert strong {
  @apply block text-red-800 dark:text-red-300;
}

.error-alert p {
  @apply mt-1 text-sm text-red-700 dark:text-red-400;
}

/* Password dialog */
.password-dialog {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4;
}

.password-content {
  @apply w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800;
}

.password-content h3 {
  @apply mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.password-content p {
  @apply mb-4 text-sm text-gray-600 dark:text-gray-400;
}

.password-input {
  @apply w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200;
}

.password-actions {
  @apply mt-4 flex justify-end gap-2;
}

.btn-secondary {
  @apply rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
}

.btn-primary {
  @apply rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700;
}

/* Loading */
.pdf-loading {
  @apply flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-12 dark:border-gray-700 dark:bg-gray-800;
}

.spinner {
  @apply h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600;
}

/* Responsive */
@media (max-width: 768px) {
  .pdf-controls {
    @apply flex-col;
  }

  .control-group {
    @apply w-full justify-center;
  }
}
</style>
