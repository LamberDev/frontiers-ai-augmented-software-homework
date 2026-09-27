<script setup lang="ts">
/**
 * Primary navigation header (atomic "template" level — see
 * `odd/tasks/frontend-ui.md`, atomic-design-to-FSD mapping table): a glass
 * bar with the brand wordmark on the left and the primary navigation links
 * on the right. Wraps the shared `.glass-surface` class (see
 * `shared/ui/styles/glass.css`) instead of styling Vuetify directly.
 *
 * Nav items are data (not hand-written markup) rendered with `v-for`, so
 * adding a route only means adding an entry here. `RouterLink` sets
 * `aria-current="page"` on the exact-active link by default; its own
 * `router-link-exact-active` class (also default) drives the visible active
 * style below.
 */
import { BrandLogo } from '@/shared/ui'

interface NavItem {
  to: string
  label: string
}

const navItems: readonly NavItem[] = [
  { to: '/register', label: 'Register user' },
  { to: '/invite', label: 'Invite reviewer' },
]
</script>

<template>
  <header class="app-header glass-surface">
    <BrandLogo subtitle="Peer Review" />
    <nav aria-label="Primary" class="app-header__nav">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="app-header__link">
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0;
}

.app-header__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.app-header__link {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  color: var(--glass-text, #17171c);
  font-weight: 600;
  text-decoration: none;
}

.app-header__link:focus-visible {
  outline: 3px solid #8033cc; /* ring */
  outline-offset: 2px;
}

.app-header__link.router-link-exact-active {
  color: #4d1b7e; /* primary */
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
</style>
