<script setup lang="ts">
import { AppHeader } from '@/widgets/app-header'
import { GlassShell } from '@/widgets/glass-shell'
</script>

<template>
  <v-app>
    <v-main>
      <GlassShell>
        <template #header>
          <AppHeader />
        </template>
        <RouterView />
      </GlassShell>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Let GlassShell's fixed brand gradient show through instead of Vuetify's
   theme "background" color (see `shared/config/theme/frontiersTheme.ts`). */
.v-application {
  background: transparent;
}
</style>
