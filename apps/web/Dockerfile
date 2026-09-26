# syntax=docker/dockerfile:1

# Build stage: installs dependencies and produces the production bundle.
# Node version matches .nvmrc; Corepack (bundled with Node) provides the
# exact pnpm version pinned by the packageManager field below.
FROM node:24-alpine AS build
WORKDIR /src

COPY package.json ./
RUN corepack enable && corepack install

# Copy only the dependency manifests first so this layer (the slow one) is
# cached until a dependency actually changes.
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite inlines VITE_* variables into the built bundle at build time (see
# apps/web/AGENTS.md), so the API origin the served site will call is fixed
# for this image and requires a rebuild to change.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
# Fail fast: without an API origin the image would build and pass its
# healthcheck but every API call would fail in the browser.
RUN test -n "$VITE_API_URL" || (echo "The VITE_API_URL build argument is required." >&2 && exit 1)
RUN pnpm build

# Runtime stage: serves the static bundle with nginx as its own unprivileged
# user (no root required), listening on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 8080

# The alpine base includes BusyBox wget, so the image can check its own
# health without extra tooling (unlike apps/api's Debian-based runtime image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
