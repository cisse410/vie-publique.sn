import { VuePDFjs } from '@tuttarealstep/vue-pdf.js'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VuePdf', VuePDFjs)
})
