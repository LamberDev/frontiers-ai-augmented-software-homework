// `getApiUrl` is exported (not called eagerly) so importing anything else from this
// barrel — like the Vuetify theme tokens below — never requires `VITE_API_URL` to be
// configured. Callers that need the API URL call `getApiUrl()` themselves.
export { getApiUrl } from './apiUrl'

export { frontiersTheme, glassTokens } from './theme/frontiersTheme'
