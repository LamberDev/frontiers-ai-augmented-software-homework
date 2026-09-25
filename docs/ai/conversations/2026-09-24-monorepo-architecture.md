# Session 2026-09-24: monorepo architecture

Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).
Model thinking, raw tool output and harness attachments are omitted; tool calls
are summarised in one line each.

## Human

Vamos a comenzar creando la arquitectura del monorepo y definiendo las herramientas/tecnologias/patrones que vamos a utilizar. 


```text

# Estructura del monorepo

Crea la carpeta `apps/` (estándar de monorepos) con dos aplicaciones:

- `apps/api` → API en .NET 10 con Clean Architecture + Screaming Architecture.
- `apps/web` → Aplicación Vue 3 (última versión estable, 3.5.x; NO uses la 3.6 en RC) con Feature-Sliced Design (FSD).

En la raíz crea también `docs/` (vacía por ahora, con un `.gitkeep`), un `.gitignore` que cubra
.NET y Node, un `.editorconfig` y un `README.md` mínimo.

# Backend (apps/api)

## Reglas de arquitectura

Es un proyecto pequeño, así que mantenemos cuatro capas con la regla de dependencia básica:

- `PeerReview.Domain`: no depende de nada (ni de otros proyectos ni de paquetes de infraestructura).
- `PeerReview.Application`: SOLO depende de Domain. Aquí se definen los puertos (interfaces) que
  Infrastructure implementará.
- `PeerReview.Infrastructure`: depende de Application (y, por tanto, de Domain). Implementa los puertos.
- `PeerReview.Api`: capa de presentación y composition root. Depende de Application e Infrastructure
  y es el único sitio donde se registran las dependencias.

La parte Screaming se aplica DENTRO de cada capa: las carpetas se organizan por capacidad de negocio
(`Users/RegisterUser`, `Reviewers/InviteReviewer`), nunca por tipo técnico (`Controllers/`,
`Services/`, `Dtos/`, `Helpers/`). Los nombres de los puertos describen la necesidad del negocio,
no la tecnología (por ejemplo `IUniversityDirectory`, no `IFrontiersApiClient`).

## Estructura esperada

```
apps/api/
├─ src/
│  ├─ PeerReview.Domain/
│  │  ├─ Users/
│  │  ├─ Universities/
│  │  └─ Reviewers/
│  ├─ PeerReview.Application/
│  │  ├─ Users/RegisterUser/
│  │  ├─ Reviewers/InviteReviewer/
│  │  ├─ Abstractions/
│  │  └─ DependencyInjection.cs
│  ├─ PeerReview.Infrastructure/
│  │  ├─ Persistence/
│  │  ├─ Universities/FrontiersOrganizations/
│  │  └─ DependencyInjection.cs
│  └─ PeerReview.Api/
│     ├─ Users/
│     ├─ Reviewers/
│     └─ Program.cs
├─ tests/
│  ├─ PeerReview.Domain.UnitTests/
│  └─ PeerReview.Application.UnitTests/
├─ PeerReview.slnx
├─ Directory.Build.props
└─ Directory.Packages.props
```

## Herramientas y convenciones

- Solución en formato `.slnx` con todos los proyectos añadidos.
- `Directory.Build.props` con `net10.0`, `Nullable` habilitado, `ImplicitUsings` habilitado y
  `TreatWarningsAsErrors` en true.
- `Directory.Packages.props` para gestión centralizada de versiones de NuGet.
- La API usa Minimal APIs, con un fichero de endpoint por caso de uso dentro de su carpeta de negocio.
- Tests con xUnit. Los proyectos de test reflejan la misma estructura por negocio que el proyecto que prueban.
- Deja las carpetas de negocio creadas pero sin clases de dominio ni handlers todavía; solo los
  `DependencyInjection.cs` vacíos y un `Program.cs` que arranque y responda en `/health`.

# Frontend (apps/web)

## Reglas de arquitectura

Usamos Feature-Sliced Design con las capas en este orden fijo:
`app → pages → widgets → features → entities → shared`.

- Cada capa solo puede importar de las capas que están por debajo de ella.
- Los slices se nombran en kebab-case y por negocio, reflejando los mismos casos de uso que el
  backend (`register-user`, `invite-reviewer`, `user`, `university`).
- Dentro de cada slice solo se usan los segmentos estándar: `ui`, `model`, `api`, `lib`, `config`.
- Cada slice expone su API pública únicamente mediante su `index.ts`; está prohibido importar
  rutas internas de otro slice.
- `shared` no contiene lógica de negocio, solo infraestructura reutilizable (cliente HTTP, config, UI base).

## Estructura esperada

```
apps/web/src/
├─ app/
│  ├─ providers/router.ts
│  ├─ styles/main.css
│  ├─ App.vue
│  └─ index.ts
├─ pages/
│  ├─ register-user/
│  └─ invite-reviewer/
├─ widgets/
│  └─ app-header/
├─ features/
│  ├─ register-user/
│  └─ invite-reviewer/
├─ entities/
│  ├─ user/
│  └─ university/
├─ shared/
│  ├─ api/
│  ├─ config/
│  ├─ ui/
│  └─ lib/
└─ main.ts
```

## Herramientas y convenciones

- Proyecto creado con Vite + TypeScript, gestor de paquetes pnpm.
- Vue Router para las dos páginas.
- Vitest para tests unitarios.
- ESLint con la configuración oficial de Vue y TypeScript.
- Steiger (linter oficial de FSD) configurado para validar las reglas de capas e imports públicos.
- Alias `@/` apuntando a `src/`.
- La URL del backend se lee de `VITE_API_URL` desde `shared/config`.
- Componentes Vue en PascalCase. Crea solo páginas placeholder mínimas para comprobar que el router
  funciona; sin formularios ni llamadas al API todavía.

# Criterios de aceptación

Al terminar, antes de darlo por hecho, verifica y muéstrame el resultado de:

1. `dotnet build` en `apps/api` compila sin errores ni warnings.
2. `dotnet test` en `apps/api` se ejecuta (aunque no haya tests aún).
3. Validación manual de la regla de dependencia (temporal, hasta que añadamos un test de
   arquitectura con NetArchTest o ArchUnitNET). Ejecuta estos comandos desde `apps/api`,
   muéstrame su salida y confirma que coincide con lo esperado:

   | Comando | Resultado esperado |
   |---|---|
   | `dotnet list src/PeerReview.Domain reference` | Ninguna referencia |
   | `dotnet list src/PeerReview.Application reference` | Solo `PeerReview.Domain` |
   | `dotnet list src/PeerReview.Infrastructure reference` | Solo `PeerReview.Application` |
   | `dotnet list src/PeerReview.Api reference` | `PeerReview.Application` y `PeerReview.Infrastructure` |

   Comprueba también los paquetes NuGet, porque una capa puede romper la regla sin referenciar
   otro proyecto:

   - `dotnet list src/PeerReview.Domain package` → ningún paquete.
   - `dotnet list src/PeerReview.Application package` → como mucho paquetes de abstracciones
     (por ejemplo `Microsoft.Extensions.DependencyInjection.Abstractions`); nunca EF Core,
     ASP.NET Core ni clientes HTTP.

   Por último, verifica que no haya `using` que crucen capas hacia arriba. Este comando no debe
   devolver resultados:

```bash
   grep -rE "using PeerReview\.(Infrastructure|Api)" src/PeerReview.Domain src/PeerReview.Application
```

   Si alguna comprobación falla, corrige las referencias antes de dar el paso por terminado y
   explícame qué estaba mal.
4. `pnpm build`, `pnpm lint` y `pnpm steiger` en `apps/web` pasan sin errores.
5. El árbol final de carpetas del monorepo.

```

<details><summary>Tool calls</summary>

- `Bash` — Check toolchain versions and repo state: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && git status --short; git branch --show-current; dotnet --list-sdks 2>&1 | tail -3; node -`

</details>

## Human (answer to blocking question)

> ¿Cómo resolvemos la falta del SDK de .NET 10?

Options:

- **Instálalo con winget**: Ejecuto `winget install Microsoft.DotNet.SDK.10` en tu máquina (puede pedir elevación de permisos) y sigo con el plan tal cual.
- **Lo instalo yo**: Me paro aquí; avísame cuando `dotnet --list-sdks` muestre un 10.x y arranco.
- **Usar .NET 9**: Cambio el objetivo a net9.0 con el SDK que ya tienes (se aparta de tu especificación).

**Answer:** Instálalo con winget

<details><summary>Tool calls</summary>

- `Bash` — Install .NET 10 SDK via winget: `winget install --id Microsoft.DotNet.SDK.10 --accept-source-agreements --accept-package-agreements --disable-interactivity 2>&1 | tail -8; "/c/Program Files/dot`

</details>

## Human

_(sent while the assistant was working)_

Recuerda incluir en el AGENTS.md de cada monorepo las instrucciones basicas de cada repositorio en cuanto a la arquitectura de cada aplicacion de momento, ya lo ampliaremos mas tarde.

<details><summary>Tool calls</summary>

- `Bash` — Create branch and ODD feature document: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && git switch -c chore/monorepo-scaffold && mkdir -p odd/tasks && cat > odd/tasks/monorepo-`
- `engram.mem_save` — ODD feature monorepo-scaffold tasks
- `engram.mem_judge` — rel-62386b4de0fa7b37
- `engram.mem_judge` — rel-fb65c624d2724581

</details>

## Assistant

Documento de seguimiento creado: `odd/tasks/monorepo-scaffold.md`, con 4 tareas (T1 raíz, T2 backend, T3 frontend, T4 verificación). Delego ahora la raíz y el backend a un agente.

<details><summary>Tool calls</summary>

- `Agent` — Scaffold root and .NET backend

</details>

## Assistant

Voy por la tarea T2. Un agente está montando los ficheros de la raíz y el backend .NET 10, y tiene prohibido hacer commits. Cuando termine revisaré lo que ha hecho y lanzaré el frontend (T3). No los lanzo en paralelo porque los dos modificarían `.gitignore`.

_[Background agent finished and reported back]_

<details><summary>Tool calls</summary>

- `Bash` — Spot-check backend build and files: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework/apps/api" && dotnet build 2>&1 | tail -4; cat NuGet.Config; cat src/PeerReview.Api/Program.c`
- `Bash` — Update feature doc with T1/T2 progress: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && python - <<'EOF'`
- `Agent` — Scaffold Vue 3 FSD frontend

</details>

## Assistant

El backend está terminado. Además de lo que dijo el agente, he vuelto a compilarlo yo: `dotnet build` da 0 warnings y 0 errores. La comprobación de la regla de dependencia sale bien y `/health` responde 200.

Hay una cosa que no pediste: el agente añadió un `apps/api/NuGet.Config` que solo usa nuget.org. Lo hizo porque en tu máquina hay configurado a nivel global un feed privado de Azure DevOps que devuelve un error 401 y rompía la restauración de paquetes. Ese fichero solo afecta a `apps/api`; tu configuración global sigue igual.

Ahora otro agente está montando el frontend (T3), también sin commits. Le he pedido que, por el TDD estricto, escriba primero el test de la lectura de `VITE_API_URL` y lo vea fallar antes de implementarla. Cuando termine te enseño todas las verificaciones juntas.

_[Background agent finished and reported back]_

<details><summary>Tool calls</summary>

- `Bash` — Run backend acceptance checks: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework/apps/api" && echo "== dotnet build" && dotnet build 2>&1 | grep -E "Advertencia|Errores|erro`
- `Bash` — Run frontend acceptance checks: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework/apps/api" && dotnet test >/dev/null 2>&1; echo "dotnet test exit=$?"; cd ../web && for s in `
- `Bash` — Print monorepo tree and check ignored artifacts: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && git status --short --untracked-files=all | grep -Ei "node_modules|/bin/|/obj/|dist/" | h`
- `Bash` — Update feature doc with T3/T4 evidence: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && python - <<'EOF'`
- `engram.mem_save` — ODD feature monorepo-scaffold tasks

</details>

## Assistant

El monorepo está montado y todos los criterios de aceptación pasan. He vuelto a ejecutar yo todas las comprobaciones. No hay nada commiteado. Solo falta crear a mano `apps/web/.env.example`: Claude Code tiene una regla de permisos que bloquea escribir ficheros `.env*`.

**1. `dotnet build`:** 0 advertencias y 0 errores.

**2. `dotnet test`:** termina con código 0. Avisa de que no hay pruebas, lo cual es informativo.

**3. Regla de dependencia:** todas las capas cumplen lo esperado.

| Comando | Resultado | ¿Coincide? |
|---|---|---|
| `dotnet list src/PeerReview.Domain reference` | "No hay ninguna referencia Proyecto a proyecto" | ✅ |
| `dotnet list src/PeerReview.Application reference` | Solo `PeerReview.Domain.csproj` | ✅ |
| `dotnet list src/PeerReview.Infrastructure reference` | Solo `PeerReview.Application.csproj` | ✅ |
| `dotnet list src/PeerReview.Api reference` | `PeerReview.Application.csproj` y `PeerReview.Infrastructure.csproj` | ✅ |
| `dotnet list src/PeerReview.Domain package` | "No se encontró ningún paquete" | ✅ |
| `dotnet list src/PeerReview.Application package` | Solo `Microsoft.Extensions.DependencyInjection.Abstractions 10.0.12` | ✅ |
| `grep -rE "using PeerReview\.(Infrastructure\|Api)" …` | Sin salida | ✅ |

Además, `GET /health` responde 200 `Healthy`.

**4. Frontend:** `pnpm build`, `pnpm lint`, `pnpm steiger` ("No problems found!") y `pnpm test` (2 tests pasados) terminan con código 0. La versión instalada es `vue 3.5.43`, fijada con `~3.5.43` para que nunca suba a 3.6.

**5. Árbol final** (sin los `.gitkeep`):
```
.editorconfig  .gitignore  README.md
apps/
  api/   AGENTS.md  Directory.Build.props  Directory.Packages.props  NuGet.Config  PeerReview.slnx
    src/
      PeerReview.Domain/          Users/  Universities/  Reviewers/
      PeerReview.Application/     Users/RegisterUser/  Reviewers/InviteReviewer/  Abstractions/  DependencyInjection.cs
      PeerReview.Infrastructure/  Persistence/  Universities/FrontiersOrganizations/  DependencyInjection.cs
      PeerReview.Api/             Users/  Reviewers/  Program.cs  appsettings*.json  Properties/launchSettings.json
    tests/
      PeerReview.Domain.UnitTests/       Users/  Universities/  Reviewers/
      PeerReview.Application.UnitTests/  Users/RegisterUser/  Reviewers/InviteReviewer/
  web/   AGENTS.md  package.json  pnpm-lock.yaml  vite.config.ts  eslint.config.ts  steiger.config.ts  tsconfig*.json  index.html
    src/
      app/       App.vue  index.ts  providers/router.ts  styles/main.css
      pages/     register-user/ui/RegisterUserPage.vue   invite-reviewer/ui/InviteReviewerPage.vue
      widgets/   app-header/ui/AppHeader.vue
      features/  register-user/index.ts  invite-reviewer/index.ts
      entities/  user/model/types.ts  university/model/types.ts
      shared/    api/httpClient.ts  config/apiUrl.ts (+ apiUrl.test.ts)  ui/  lib/
      main.ts  vite-env.d.ts
docs/ai/ …
odd/tasks/monorepo-scaffold.md
```

**Cosas que difieren de tu especificación o conviene que sepas:**
- **`apps/api/NuGet.Config`:** solo usa nuget.org. En tu máquina hay configurado a nivel global un feed privado de Azure DevOps que devuelve 401 y rompía la restauración de paquetes.
- **TDD estricto:** lo único con comportamiento real es la lectura de `VITE_API_URL`. Su test se escribió primero y se vio fallar (`Failed to resolve import "./apiUrl"`) antes de implementarla. El `/health` no tiene test porque tu estructura no incluye un proyecto de tests para la Api.
- **Steiger:** he relajado 3 reglas mientras no haya código, cada una limitada a su capa y con un comentario en `steiger.config.ts`:
  - `insignificant-slice` en `entities`
  - `no-segmentless-slices` en `features`
  - `segments-by-purpose` en `app`

  Habrá que reactivarlas cuando esas capas tengan contenido.
- **TypeScript:** está fijado en `~6.0.3`, no en la 7. `typescript-eslint` todavía no soporta TypeScript 7.
- **`.env.example`:** créalo tú con `VITE_API_URL=http://localhost:5299`.

**Commit:** el cambio son unas 860 líneas escritas a mano, sin contar `pnpm-lock.yaml`. Eso supera las ~400 que el flujo usa como referencia para una PR revisable. Propongo tres commits en esta rama:
1. `chore: add root tooling files`: `.gitignore`, `.editorconfig`, `README.md` y el documento de seguimiento.
2. `feat(api): scaffold .NET 10 clean architecture solution`
3. `feat(web): scaffold Vue 3 FSD application`

Queda por decidir cómo se entregan:
- **Una sola PR** con los tres commits.
- **Dos PRs encadenadas:** raíz y api en una, web en otra.

¿Hago los commits, y con qué opción? Después de cada commit, Gentle AI evaluará el riesgo y seguramente te pedirá consentimiento para la revisión.

## Human

haz los commits

<details><summary>Tool calls</summary>

- `Bash` — Create root and api commits: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && T='Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>' && git add .git`
- `Bash` — Commit web, then run RDD assessment: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && python - <<'EOF'`
- `Bash` — Run exact preflight STATUS from assessment: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && gentle-ai review status '--cwd=<home>\source\personal\frontiers-ai-augmented-software-ho`
- `Bash` — Run provider-issued review START: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && gentle-ai review start '--cwd=<home>\source\personal\frontiers-ai-augmented-software-hom`

</details>

## Assistant

He hecho los tres commits en `chore/monorepo-scaffold`. Gentle AI ha evaluado los tres juntos, ha visto que superan el tamaño para una sola revisión y pide tu consentimiento.

## Human (answer to blocking question)

> Gentle AI puede revisar este cambio antes de que lo des por terminado. Motivo: la revisión puede ayudar a detectar regresiones en estos cambios. Beneficio: revisar tarda un poco más y deja el resultado más seguro. Evidencia de riesgo (nivel medium, 71 ficheros, 4044 líneas): «este cambio no es solo documentación pasiva, así que recibe una revisión consolidada» y «un cambio ejecutable en .editorconfig». Nota: para desactivar las revisiones de forma permanente, ejecuta 'gentle-ai review mode disable'. ¿Qué quieres hacer?

Options:

- **Review this change**: Consecuencia: revisa solo este cambio; los siguientes cambios de riesgo medio o alto volverán a preguntar, y la entrega necesita una aprobación aparte.
- **Skip this time**: Consecuencia: omite solo este cambio; no se crea registro de revisión y las revisiones futuras siguen activadas.

**Answer:** Review this change

<details><summary>Tool calls</summary>

- `Bash` — Run granted review START: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && gentle-ai review start --contract gentle-ai.review-integration/v2 --cwd '<home>\source\p`

</details>

## Human

_(sent while the assistant was working)_

tras la revision partelo en 3 mr

<details><summary>Tool calls</summary>

- `Bash` — Run bound review STATUS: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && gentle-ai review status --contract=gentle-ai.review-integration/v2 --next-transition=tru`

</details>

## Assistant

Revisión en marcha, con un solo revisor (reliability). Lanzo la captura, que ejecuta Gentle AI.

<details><summary>Tool calls</summary>

- `Bash` — Run in-process reviewer capture: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && gentle-ai review capture-result --lineage=review-6ede14cf61a4c9ef --expected-revision=sh`
- `Bash` — Inspect capture result keys: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && python -c "`
- `Bash` — List findings and acknowledge approval: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && python -c "`

</details>

## Assistant

Revisión aprobada y cerrada. Antes de partirlo en 3 PRs cargo la skill de PRs encadenadas.

<details><summary>Tool calls</summary>

- `Skill`
- `Bash` — Count authored lines per commit: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && for c in a44ba8b d7bfff1 37cb9f4; do echo "$c $(git show --numstat --format= $c | grep -`

</details>

## Human (answer to blocking question)

> ¿Qué estrategia de encadenado usamos para las 3 PRs (raíz 67 líneas, api 274, web 535 sin contar pnpm-lock.yaml)?

Options:

- **Stacked a main (Recommended)**: PR1 raíz → main; PR2 api → rama de PR1; PR3 web → rama de PR2. Cada una se fusiona a main en orden y se reapunta la siguiente. Encaja porque cada slice funciona por sí solo.
- **Feature branch chain**: Se crea una PR tracker en borrador (no se fusiona) hacia main; PR1 apunta al tracker y las siguientes a su padre. Todo se integra en la rama feature y al final entra a main de una vez.

**Answer:** Stacked a main (Recommended)

<details><summary>Tool calls</summary>

- `Bash` — Create and push the three stacked branches: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && git branch chore/monorepo-root a44ba8b && git branch feat/api-scaffold d7bfff1 && git br`
- `Bash` — Create PR 1 of the stack: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && S="<home>/AppData/Local/Temp/claude/<project-dir>/<session-id>/scratchpad" && diagram() `
- `Bash` — Create PRs 2 and 3, fix PR 1 numbering: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework" && S="<home>/AppData/Local/Temp/claude/<project-dir>/<session-id>/scratchpad" && diagram() `
- `engram.mem_save` — ODD feature monorepo-scaffold tasks

</details>

## Assistant

La revisión ha aprobado los tres commits y el cambio ya está partido en 3 PRs encadenadas hacia `main`. No las he fusionado porque no me lo pediste.

**Revisión RDD:** la aprobó el único revisor que eligió Gentle AI (fiabilidad) y quedó cerrada. Dejó 6 observaciones que no bloquean y que conviene tratar como trabajo posterior:

| ID | Tipo | Dónde | Qué dice |
|---|---|---|---|
| R3-001 | Warning | `apps/web/src/shared/config/index.ts:3` | `apiUrl` se lee nada más importar el módulo. Si falta `VITE_API_URL`, cualquier módulo que lo importe falla al importarse, no con un error de configuración controlado. |
| R3-002 | Warning | `apps/web/src/shared/api/httpClient.ts:11` | Al construir la URL se pierde el prefijo de ruta que tenga la base (por ejemplo `/api`), y el cliente no tiene test. |
| R3-003 | Sugerencia | `apps/web/src/shared/config/apiUrl.ts:11` | Acepta valores con solo espacios o que no son una URL válida. |
| R3-004 | Sugerencia | `apps/api/src/PeerReview.Api/Program.cs:12` | `/health` no tiene test automático. Se podría cubrir con `WebApplicationFactory`. |
| R3-005 | Sugerencia | `apps/web/AGENTS.md:46` | Menciona un `.env.example` que no existe todavía. |
| R3-006 | Sugerencia | `apps/web/index.html:5` | Enlaza un favicon que no existe, así que cada carga de página da un 404. |

**Las 3 PRs** (se fusionan en orden):
```
main
 └─ #3 chore/monorepo-root    → main                  +66/−1
     └─ #4 feat/api-scaffold  → chore/monorepo-root   +274
         └─ #5 feat/web-scaffold → feat/api-scaffold  +3703 (535 escritas a mano; el resto es pnpm-lock.yaml)
```
- [#3](https://github.com/LamberDev/frontiers-ai-augmented-software-homework/pull/3): ficheros de la raíz.
- [#4](https://github.com/LamberDev/frontiers-ai-augmented-software-homework/pull/4): API en .NET 10.
- [#5](https://github.com/LamberDev/frontiers-ai-augmented-software-homework/pull/5): frontend en Vue 3 con FSD.

Cada PR contiene solo su parte. Su descripción explica el orden en la cadena, de qué depende y cómo se verificó.

La #5 supera las ~400 líneas de referencia. En la descripción propongo aceptarla como excepción de tamaño, porque la configuración de herramientas y el esqueleto de FSD solo tienen sentido juntos.

**Queda pendiente:**
1. **Fusionar:** si quieres que las fusione, voy de la #3 a la #5 y cambio la base de cada PR a `main` antes de fusionarla.
2. **`apps/web/.env.example`:** tienes que crearlo tú, con `VITE_API_URL=http://localhost:5299`.
3. **Documento de seguimiento:** el resultado de la revisión y las PRs está guardado en Engram, pero no en `odd/tasks/monorepo-scaffold.md`. Actualizarlo supone otro commit; ¿lo hago?
4. **Observaciones de la revisión:** puedo abrirlas como tareas para la siguiente feature.
