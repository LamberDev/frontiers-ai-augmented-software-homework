<script setup lang="ts">
/**
 * Full-viewport glass shell (atomic "template" level — see
 * `odd/tasks/frontend-ui.md`, atomic-design-to-FSD mapping table). Renders a
 * purely decorative brand-gradient background with blurred accent blobs
 * behind a `header` slot and a centered, responsive content container.
 *
 * The gradient/blob hex values mirror the Frontiers brand tokens documented
 * in `odd/tasks/frontend-ui.md` ("Brand tokens" section) and are only
 * duplicated here, in one place, since they are pure decoration with no
 * equivalent Vuetify theme color.
 *
 * This component renders no landmark elements of its own: `header`/`main`
 * land on whatever the caller puts in its slots (e.g. `AppHeader`'s own
 * `<header>`, and `v-main`'s own `<main>` wrapping this component), so a page
 * using `GlassShell` never ends up with duplicate landmarks.
 */
</script>

<template>
  <div class="glass-shell">
    <div class="glass-shell__background" aria-hidden="true">
      <span class="glass-shell__blob glass-shell__blob--teal" />
      <span class="glass-shell__blob glass-shell__blob--purple" />
      <span class="glass-shell__blob glass-shell__blob--blue" />
    </div>
    <div v-if="$slots.header" class="glass-shell__header">
      <slot name="header" />
    </div>
    <div class="glass-shell__container">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.glass-shell {
  position: relative;
  min-height: 100%;
}

/* Fixed to the viewport (not the page), so the brand gradient always fills
   the screen behind the scrollable content, however tall the page grows. */
.glass-shell__background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(135deg, #0c4ded 0%, #003bde 55%, #0024b0 100%);
}

.glass-shell__blob {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
}

.glass-shell__blob--teal {
  top: -10%;
  left: -8%;
  width: 40vmax;
  height: 40vmax;
  background: #25bcbd;
  animation: glass-shell-float 22s ease-in-out infinite;
}

.glass-shell__blob--purple {
  right: -10%;
  bottom: -15%;
  width: 45vmax;
  height: 45vmax;
  background: #712e74;
  animation: glass-shell-float 26s ease-in-out infinite reverse;
}

.glass-shell__blob--blue {
  top: 30%;
  right: 15%;
  width: 25vmax;
  height: 25vmax;
  background: #6d9efd;
  animation: glass-shell-float 18s ease-in-out infinite;
}

@keyframes glass-shell-float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(3%, 4%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glass-shell__blob {
    animation: none;
  }
}

.glass-shell__header {
  position: relative;
}

.glass-shell__container {
  position: relative;
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

@media (min-width: 600px) {
  .glass-shell__container {
    padding: 2rem 1.5rem;
  }
}
</style>
