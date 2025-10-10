import { defineNuxtPlugin } from '#app'
import { VPdfViewer } from '@vue-pdf-viewer/viewer'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VPdfViewer', VPdfViewer)
})
