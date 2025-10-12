<script setup lang="ts">
import { reactive, useTemplateRef, computed } from 'vue'
import '@tuttarealstep/vue-pdf.js/dist/style.css'
import enUS_FTL from '@tuttarealstep/vue-pdf.js/l10n/en-US/viewer.ftl?raw'

const VuePDFjs = defineAsyncComponent(() =>
  import('@tuttarealstep/vue-pdf.js').then((m) => m.VuePDFjs),
)

interface Props {
  source: string
  locale?: 'en-US'
  searchQuery?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'en-US',
  searchQuery: '',
  height: '100vh',
})

const emit = defineEmits<{
  loaded: [pdfApp: any]
  error: [error: Error]
}>()

const pdfComponent = useTemplateRef<any>('pdfComponent')

const localeMap = {
  'en-US': enUS_FTL,
}

const pdfOptions = reactive({
  locale: {
    code: props.locale,
    ftl: localeMap[props.locale],
  },
  toolbar: {
    visible: true,
    options: {
      previous: true,
      next: true,
      downloadButton: true,
      printButton: false,
      editorFreeTextButton: false,
      editorHighlightButton: false,
      editorInkButton: false,
      editorStampButton: false,

      secondaryToolbarToggleButton: true,
      presentationMode: true,
      secondaryOpenFile: false,
      secondaryPrint: false,
      secondaryDownload: true,
      documentProperties: false,
      viewBookmark: false,
      firstPage: true,
      lastPage: true,
    },
  },
})

const handlePdfLoaded = () => {
  if (!pdfComponent.value?.pdfApp) {
    return
  }

  // Recherche automatique si une requête est fournie
  if (props.searchQuery) {
    pdfComponent.value.pdfApp.eventBus.on('pagesloaded', () => {
      pdfComponent.value?.pdfApp.eventBus.dispatch('find', {
        query: [props.searchQuery],
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
      })
    })
  }

  emit('loaded', pdfComponent.value.pdfApp)
}

// Exposer les méthodes pour interaction depuis le parent
defineExpose({
  pdfApp: computed(() => pdfComponent.value?.pdfApp),
  search: (query: string, options = {}) => {
    if (pdfComponent.value?.pdfApp) {
      pdfComponent.value.pdfApp.eventBus.dispatch('find', {
        query: [query],
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        ...options,
      })
    }
  },
})
</script>
<template>
  <div class="pdf-viewer-container">
    <ClientOnly>
      <VuePDFjs
        ref="pdfComponent"
        :source="source"
        :options="pdfOptions"
        @pdf-app:loaded="handlePdfLoaded"
      >
        <template #loading>
          <div class="custom-loader">
            <div class="spinner"></div>
            <p>Chargement du document...</p>
          </div>
        </template>
      </VuePDFjs>
    </ClientOnly>
  </div>
</template>


<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: v-bind(height);
  position: relative;
}

:deep(.vue-pdfjs-viewer) {
  height: 100%;
  width: 100%;
}

.custom-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.8);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #1f4ee8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.vue-pdfjs {
  --primary-color: #4285f4;
  --sidebar-narrow-bg-color: #f1f1f1;
  --toolbar-bg-color: #f9f9f9;
  --main-color: #333333;
  --button-hover-color: rgba(66, 133, 244, 0.2);
  --toggled-btn-color: blue;
  --toggled-btn-hover-color: rgba(66, 133, 244, 0.4);
}
</style>
