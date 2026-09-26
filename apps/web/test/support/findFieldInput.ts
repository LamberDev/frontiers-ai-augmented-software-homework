import type { VueWrapper } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'

/**
 * Test-only helper: finds a `FormField`/`GlassTextField`'s native `<input>`
 * by its visible label text (`<label for="...">`), the same way a real user
 * or assistive technology would locate it — instead of a CSS selector tied
 * to internal markup. Shared by `RegisterUserForm`/`InviteReviewerForm` and
 * page-level tests that fill in those forms.
 */
export function findFieldInput(wrapper: VueWrapper<ComponentPublicInstance>, label: string) {
  const labelEl = wrapper
    .findAll('label')
    .find((candidate) => candidate.text().startsWith(label) && !!candidate.attributes('for'))
  const forId = labelEl?.attributes('for')
  return wrapper.find(`#${forId}`)
}
