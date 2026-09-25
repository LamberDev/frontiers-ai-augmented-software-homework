<script setup lang="ts">
import { AppHeader } from '@/widgets/app-header'
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
