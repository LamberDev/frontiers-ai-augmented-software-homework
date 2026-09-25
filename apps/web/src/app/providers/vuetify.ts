import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { frontiersTheme } from '@/shared/config'

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'frontiers',
    themes: {
      frontiers: frontiersTheme,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})
