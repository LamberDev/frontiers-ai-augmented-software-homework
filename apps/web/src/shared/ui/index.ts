/**
 * Public API for the shared/ui segment.
 *
 * Base, reusable UI primitives (atomic design: atoms/molecules — see
 * `odd/tasks/frontend-ui.md` for the atomic-design-to-FSD mapping). No
 * business logic or business terms live here: components are named
 * generically (e.g. `ScoreBadge`, not "UniversityScore") so features never
 * style Vuetify directly and higher layers own domain meaning.
 *
 * Shared glass styling (CSS custom properties + `.glass-surface`) is
 * defined once in `styles/glass.css` and imported here as a side effect, so
 * any consumer of this public API gets it without needing its own import.
 */
import './styles/glass.css'

export { default as GlassButton } from './atoms/GlassButton/GlassButton.vue'
export { default as GlassTextField } from './atoms/GlassTextField/GlassTextField.vue'
export { default as BrandLogo } from './atoms/BrandLogo/BrandLogo.vue'
export { default as ScoreBadge } from './atoms/ScoreBadge/ScoreBadge.vue'

export { default as GlassCard } from './molecules/GlassCard/GlassCard.vue'
export { default as FormField } from './molecules/FormField/FormField.vue'
export { default as ResultAlert } from './molecules/ResultAlert/ResultAlert.vue'
export type { ResultAlertEntry } from './molecules/ResultAlert/ResultAlertEntry'
