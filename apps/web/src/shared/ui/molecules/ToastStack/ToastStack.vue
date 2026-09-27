<script setup lang="ts">
/**
 * Fixed top-right toast region: renders one `ResultAlert` per
 * `ResultAlertEntry`, `v-for`-keyed by the entry's own stable `id` — the
 * same results-list contract documented in `apps/web/AGENTS.md` and
 * `ResultAlert.vue`'s stateless-visibility doc comment (the parent owns the
 * list; `ResultAlert` never hides or reopens itself). A page renders its
 * composable's `results` through this component instead of listing
 * `ResultAlert` inline, so results appear as toasts stacked top-right,
 * above page content, rather than inline in the page flow (see
 * `odd/tasks/glass-palette.md`, T3).
 *
 * Adds two toast-specific behaviors on top of that shared contract:
 * - Placement: `position: fixed`, top-right, stacked vertically with a gap,
 *   collapsing to a full-width gutter below 640px (see the scoped style).
 * - Auto-dismiss: a `success` entry emits `close` on its own ~5s after it
 *   first appears; `warning`/`error`/`info` persist until the user closes
 *   them. One timer is tracked per entry `id` in `timers`, and is always
 *   cleared exactly once: when its entry leaves `items` (closed by the user,
 *   or already auto-dismissed), or when this component unmounts — so no
 *   stray timer can fire `close` for an id the parent no longer has.
 */
import { onBeforeUnmount, watch } from 'vue'
import ResultAlert from '../ResultAlert/ResultAlert.vue'
import type { ResultAlertEntry } from '../ResultAlert/ResultAlertEntry'

const AUTO_DISMISS_MS = 5000

// Lookup map (never a switch/ternary chain — see `apps/web/AGENTS.md`): only a
// `success` result is transient; a `warning`/`error`/`info` result stays until the
// user closes it, since it needs deliberate acknowledgement.
const AUTO_DISMISSES_BY_TYPE = {
  success: true,
  warning: false,
  error: false,
  info: false,
} as const satisfies Record<ResultAlertEntry['type'], boolean>

const props = defineProps<{
  items: ResultAlertEntry[]
}>()

const emit = defineEmits<{
  close: [id: string]
}>()

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function clearScheduledDismiss(id: string): void {
  const timer = timers.get(id)
  if (timer === undefined) return
  clearTimeout(timer)
  timers.delete(id)
}

function scheduleAutoDismiss(entry: ResultAlertEntry): void {
  if (!AUTO_DISMISSES_BY_TYPE[entry.type] || timers.has(entry.id)) return
  timers.set(
    entry.id,
    setTimeout(() => {
      timers.delete(entry.id)
      emit('close', entry.id)
    }, AUTO_DISMISS_MS),
  )
}

// Reconciles scheduled timers against the current `items` on every change (and once on
// mount, via `immediate`): clears timers for ids no longer present (closed by the user,
// or already auto-dismissed), then schedules any newly-arrived `success` entry.
watch(
  () => props.items,
  (current) => {
    const currentIds = new Set(current.map((entry) => entry.id))
    for (const id of [...timers.keys()]) {
      if (!currentIds.has(id)) clearScheduledDismiss(id)
    }
    for (const entry of current) {
      scheduleAutoDismiss(entry)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const id of [...timers.keys()]) clearScheduledDismiss(id)
})

function handleClose(id: string): void {
  clearScheduledDismiss(id)
  emit('close', id)
}
</script>

<template>
  <div class="toast-stack">
    <TransitionGroup name="toast-stack" tag="div" class="toast-stack__list">
      <ResultAlert
        v-for="entry in items"
        :key="entry.id"
        class="toast-stack__item"
        :type="entry.type"
        :title="entry.title"
        :message="entry.message"
        :items="entry.items"
        closable
        @close="handleClose(entry.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  width: min(24rem, calc(100vw - 2rem));
  pointer-events: none;
}

.toast-stack__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast-stack__item {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .toast-stack {
    left: 1rem;
    right: 1rem;
    width: auto;
  }
}

.toast-stack-enter-active,
.toast-stack-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.toast-stack-enter-from,
.toast-stack-leave-to {
  transform: translateX(1rem);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .toast-stack-enter-active,
  .toast-stack-leave-active {
    transition: none;
  }
}
</style>
