# Session 2026-09-25: domain model prompt review

Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).
Model thinking, raw tool output and harness attachments are omitted; tool calls
are summarised as counts, and review and memory bookkeeping is omitted.

## Summary

- **Date:** 2026-09-25
- **Model:** Claude (Claude Code)
- **Goal:** Review and tighten the prompt that would be handed to the implementing agent for the domain-model step, before it ran, then start scoping the frontend's HTTP contract in parallel.
- **Outcome:** Produced a detailed critique of the original prompt (contradictions, ambiguities, missing TDD/test guidance), a rewritten version adding UUID v7 identifiers and an explicit stop-and-wait "Fase 1" step, and ready-to-send answers to the implementing agent's Phase 1 questions. Frontend work was scoped to start contract-first in a separate git worktree, to avoid colliding with the domain-model agent still working in `feat/domain-model`.
- **Key decisions:**
  - Human decided to switch entity identifiers from database-generated `int` to domain-generated UUID v7 (`Guid`), a deliberate departure from the assignment's literal `InviteReviewer(int UserId)`, to be documented and justified in the README.
  - AI flagged four of its own drafted answers as product decisions needing explicit human confirmation rather than deciding them unilaterally (`UserName` length/uniqueness, the true meaning of `Score`, whether ineligibility is a success or an error, and commit consent).
  - Human confirmed that "one commit per work unit" stood as consent for commits on `feat/domain-model`, without push.
  - AI declined to start the pending RDD review against the domain-model agent's in-progress, uncommitted files, choosing to wait for that agent's own finished commit instead.
  - Human asked to start frontend work in parallel; AI recommended fixing the HTTP contract first and doing the frontend work in a separate worktree rather than the same checkout.
- **Human decisions:**
  - [Switch to UUID v7 identifiers, departing from the assignment](#human-decision-uuid-identifiers)

## Human

Examina este prompt que le voy a pasar a otro agente para que ejecute y dime que cambiarias y porque. 


```text

Vamos a comenzar a implementar los cambios para satisfacer los criterios de la prueba. Implementando parte por parte.

Requisitos funcionales completos, para que entiendas el dominio (NO los implementes todos ahora):

- `RegisterUser(string UserName, string UniversityName, int NumberOfPublications)`: registra un
  usuario. Con `UniversityName` se consulta el API de organizaciones de Frontiers (no me encanta que sean 3 parametros, me gusta mas la idea de un unico parametro donde el orden de estos no altera el resultado)
  (`Organization_ElasticSuggest`, limitando la respuesta a 1 resultado) para obtener más información
  de la universidad. El usuario y su universidad se guardan en una base de datos en memoria.
- `InviteReviewer(int UserId)`: invita a un usuario a revisar un artículo antes de su publicación.
  La invitación tiene éxito si `NumberOfPublications > 3` Y el `Score` de su universidad `>= 60` (Una refla de negocio clara).
  En ambos casos se devuelve un mensaje comprensible para el usuario (Recuerda que el usuario sera una persona a traves de un cliente web, pero manana puede ser una maquina, un servicio web..).

# Alcance de este paso

SOLO vamos a construir:

1. Las abstracciones básicas del dominio (shared kernel).
2. Las entidades del sistema y sus invariantes.
3. La regla de elegibilidad de revisores, como lógica de dominio pura.
4. La abstracción del repositorio base y su implementación con EF Core InMemory.

Fuera de alcance: casos de uso (handlers), cliente HTTP del API de Frontiers, endpoints, OpenAPI,
frontend y Docker.

# Contrato del API externo de organizaciones

Este es el contrato del endpoint `Organization_ElasticSuggest` de Frontiers:

<<
Implementation Notes
Retrieve a list of suggestions for validated organization entities based on elasticSearch matching of names and aliases.

Response Class (Status 200)
ModelModel Schema
[
  {
    "id": 0,
    "organizationName": "string",
    "matchedName": "string",
    "country": "string",
    "countryIsoCode": "string",
    "city": "string",
    "street": "string",
    "zipCode": "string",
    "state": "string",
    "webDomain": "string",
    "type": "string",
    "score": 0
  }
]
Parameters
Parameter    Value    Description    Parameter Type    Data Type
query    
(required)
query    string
maxcount    
query    integer
>>

Úsalo para decidir qué datos de la universidad necesita el dominio, con estas reglas:

- El dominio NO replica el modelo del API externo. `University` solo contiene los campos que el
  negocio necesita (identificador de la organización en Frontiers, nombre y `Score`, y cualquier
  otro que justifiques). El DTO del API externo se creará en Infrastructure en un paso posterior,
  como capa anticorrupción.
- Antes de escribir código, muéstrame qué campos del contrato vas a mapear a `University`, su tipo
  y si pueden venir vacíos o nulos. Espera mi confirmación.
- Si el `Score` puede venir nulo o ausente según el contrato, la universidad se considera NO
  elegible, y esto debe quedar cubierto por un test.

# Estándar de API (condiciona el diseño, se implementa en el paso de endpoints)

Nuestro API seguirá el estándar OpenAPI 3.1, usando el soporte nativo de .NET 10
(`Microsoft.AspNetCore.OpenApi`), y los errores se devolverán como Problem Details (RFC 9457).
Por eso, desde ya:

- Los nombres de entidades y propiedades del dominio deben coincidir con los que expondrá el
  contrato (`userName`, `universityName`, `numberOfPublications`, `userId`), para que no haya
  traducciones innecesarias entre capas.
- Cada error de dominio debe tener un código estable y legible (por ejemplo `User.NameRequired`),
  porque se usará como `type`/`code` en los Problem Details.
- `UserId` es de tipo `int`, porque así lo define el enunciado en `InviteReviewer(int UserId)`.

# Diseño del backend

## Domain (`PeerReview.Domain`, sin dependencias)

```
PeerReview.Domain/
├─ SharedKernel/
│  ├─ Entity.cs              # Base con identidad e igualdad por Id
│  ├─ Error.cs               # record con Code y Message
│  └─ Result.cs              # Result y Result<T>, sin excepciones para errores de negocio
├─ Users/
│  ├─ User.cs
│  └─ UserErrors.cs
├─ Universities/
│  ├─ University.cs
│  └─ UniversityErrors.cs
└─ Reviewers/
   ├─ ReviewerEligibilityPolicy.cs
   └─ ReviewerEligibility.cs      # Resultado de la evaluación, con el motivo si no es elegible
```

- `SharedKernel` es la única carpeta no nombrada por negocio: contiene los tipos base que comparte
  todo el dominio.
- Las entidades se crean mediante métodos factoría estáticos (`User.Create(...)`) que devuelven
  `Result<T>` y validan sus invariantes. Constructores privados; setters privados.
- Invariantes mínimas: `UserName` obligatorio y sin espacios sobrantes; `NumberOfPublications`
  no negativo; la universidad obligatoria para el usuario. Si necesitas una regla que no está aquí
  (longitudes máximas, rango del `Score`), pregúntame en lugar de inventarla.
- Una universidad se identifica por su identificador de organización en Frontiers: varios usuarios
  de la misma universidad deben compartir la misma `University`, no duplicarla.
- `ReviewerEligibilityPolicy` implementa la regla `NumberOfPublications > 3 && Score >= 60`. Las
  constantes deben tener nombre (nada de números mágicos) y el resultado debe indicar el motivo
  concreto cuando no es elegible (pocas publicaciones, score insuficiente o score desconocido),
  para que después podamos devolver un mensaje comprensible.

## Application (`PeerReview.Application`, solo depende de Domain)

```
PeerReview.Application/
└─ Abstractions/
   └─ Persistence/
      ├─ IRepository.cs          # Genérico: GetByIdAsync, AddAsync
      ├─ IUnitOfWork.cs          # SaveChangesAsync
      ├─ IUserRepository.cs      # Extiende IRepository<User, int>
      └─ IUniversityRepository.cs # Añade búsqueda por identificador de Frontiers
```

- El repositorio genérico debe ser mínimo: solo las operaciones que los dos casos de uso van a
  necesitar. No añadas `Update`, `Delete`, `GetAll` ni `IQueryable` expuestos.
- Todos los métodos asíncronos reciben `CancellationToken`.

## Infrastructure (`PeerReview.Infrastructure`)

```
PeerReview.Infrastructure/
├─ Persistence/
│  ├─ PeerReviewDbContext.cs     # Implementa IUnitOfWork
│  ├─ Configurations/
│  │  ├─ UserConfiguration.cs
│  │  └─ UniversityConfiguration.cs
│  └─ Repositories/
│     ├─ Repository.cs           # Implementación genérica base
│     ├─ UserRepository.cs
│     └─ UniversityRepository.cs
└─ DependencyInjection.cs        # Registra DbContext InMemory y repositorios
```

- `Microsoft.EntityFrameworkCore.InMemory`, con la versión gestionada en `Directory.Packages.props`.
- El mapeo se hace con configuraciones Fluent API (`IEntityTypeConfiguration<T>`), nunca con
  atributos en las entidades de dominio.
- El `Id` de `User` lo genera la base de datos.

Antes de dar el paso por terminado, verifica y muéstrame:

1. `dotnet build` sin errores ni warnings y `dotnet test` con todos los tests en verde.
2. `dotnet format whitespace` y `dotnet format style` con `--verify-no-changes` pasan, igual que en CI.
3. La regla de dependencia sigue cumpliéndose: repite las comprobaciones de `dotnet list reference`,
   `dotnet list package` y el `grep` de `using` del primer paso, incluyendo el nuevo proyecto de tests.
   Domain debe seguir sin ningún paquete NuGet.
4. Un resumen de las decisiones de diseño que hayas tomado y que no estuvieran en este prompt.
5. Registra el progreso en `odd/tasks/domain-model.md` y haz commit en la rama `feat/domain-model`
   con el mensaje `feat(api): add domain model and in-memory persistence`. No hagas push.

```

_(2 tool calls: 2 Bash)_
- `Bash` — Read API agent guide, packages, test csproj, CI commands: `cd "<home>/source/personal/frontiers-ai-augmented-software-homework/apps/api" && cat AGENTS.md && cat Directory.Packages.props && cat tests/PeerReview.Domain.Un`

## Assistant

En general el prompt está bien: acota bien el alcance, fija la regla de dependencia, pone un punto de control antes de escribir código y pide evidencia al final. Lo he contrastado con el repo (`apps/api/AGENTS.md`, `Directory.Packages.props`, los proyectos de tests y `ci.yml`) y encuentro contradicciones y huecos que pueden hacer que el agente invente decisiones o se pare cuando no toca.

## 1. Cosas que bloquean o contradicen

**a) Las notas entre paréntesis.** "No me encanta que sean 3 parámetros…", "(Una refla de negocio clara)" o "Recuerda que el usuario será una persona…" son opiniones tuyas, no instrucciones. El agente no sabe si debe cambiar la firma de `RegisterUser` o no. Además, la firma pertenece al caso de uso, que en este paso queda fuera de alcance. Yo lo dejaría así: *"La firma del enunciado es la referencia. En el paso de casos de uso se modelará como un `RegisterUserCommand` (record con propiedades nombradas). En este paso, `User.Create` recibe argumentos nombrados."*

**b) La identidad cuando la genera la base de datos rompe `Entity`.** El `Id` de `User` lo genera EF, así que vale `0` hasta `SaveChanges`. Si `Entity` compara solo por `Id`, dos usuarios nuevos serán "iguales" antes de guardarse. Hay que pedirlo de forma explícita: *"las entidades transitorias (Id por defecto) solo son iguales por referencia"*, con su test.

**c) Qué es el Id de `University`.** Usas el id de Frontiers como identidad, pero pides además `IUniversityRepository` con "búsqueda por identificador de Frontiers". Si ese id es la clave primaria, esa búsqueda es simplemente `GetByIdAsync` y sobra. Si hay una clave interna aparte, `Entity` necesita ser genérica (`Entity<TId>`), porque `User` usa `int` generado y `University` otra cosa. Decídelo tú en el prompt, que es justo el tipo de decisión que el agente se inventaría.

**d) EF InMemory no impone índices únicos.** "No duplicar la `University`" no se puede garantizar con la configuración de EF, porque el proveedor InMemory ignora los índices únicos. Díselo, para que no dé la regla por cubierta con un `HasIndex().IsUnique()` y un test que pasa por casualidad. La garantía real será un *get-or-create* en el handler, en un paso posterior.

**e) El `Score` nulo está planteado como condicional, pero el contrato no lo aclara.** El Swagger no marca qué campos admiten nulo, así que el agente no puede deducirlo. Y la política ya incluye el motivo "score desconocido", lo que obliga a un `Score` nullable de todas formas. Conviene decidirlo en firme: *"`Score` es nullable en `University`; nulo significa no elegible."*

Sobre el tipo del `Score`, el contrato solo muestra `0`. Pide que lo justifique (int o decimal) y que haya tests en el límite: `59`, `60` y, si es decimal, `59.9`.

**f) La confirmación y las preguntas pueden no funcionar con un sub-agente.** "Espera mi confirmación" y "pregúntame en lugar de inventarla" solo funcionan si el agente puede interactuar contigo. Mejor así: *"Fase 1: entrega el mapeo de campos y la lista de dudas (longitudes máximas, rango del Score, etc.) en un solo mensaje y PARA. No escribas código hasta mi respuesta."* Un único punto de parada evita que se detenga varias veces a mitad del trabajo.

## 2. Ambigüedades de diseño

**g) El `code` no puede ir en el `type` de Problem Details.** En RFC 9457, `type` es una URI, y `User.NameRequired` no lo es. Indica que el código irá como extensión `code` y que `type` será una URI. Además, un código solo no permite elegir el status HTTP: añade un `ErrorType` (Validation / NotFound / Conflict) en `Error` para que el mapeo posterior sea directo.

**h) Coherencia de los códigos.** Si la propiedad se llama `userName`, el código debería ser `User.UserNameRequired` y no `User.NameRequired`. Si no, estás rompiendo la propia regla de "sin traducciones".

**i) Nombres entre el dominio y el contrato.** Aclara que coinciden salvo en mayúsculas/minúsculas (`UserName` en C# se expone como `userName` en JSON vía System.Text.Json). Si no, el agente puede acabar poniendo propiedades en camelCase en C#.

**j) Qué pasa si fallan las dos condiciones.** Si hay pocas publicaciones y además el score es bajo, ¿se devuelven todos los motivos o solo el primero? Para un mensaje comprensible, lo razonable es devolver todos. Decídelo.

**k) Qué significa "invitar".** No existe la entidad `Article` ni `Invitation`. Dilo explícitamente: *"En este paso, invitar = evaluar la elegibilidad; no se persiste ninguna invitación."* Si no, puede modelar una invitación que nadie ha pedido.

**l) El `Score` es una foto del momento del registro.** La elegibilidad usará el score guardado al registrar, no uno consultado al invitar. Es una decisión de producto; basta con que conste en el prompt.

**m) El idioma de los mensajes de error.** El prompt no lo fija. Indica que sean en inglés, coherente con el resto de artefactos.

## 3. Verificación, tests y entrega

**n) TDD.** El prompt no lo menciona salvo el test del score nulo. Indica qué ciclo seguir (RED → GREEN → REFACTOR) y la cobertura mínima:
- invariantes de `User.Create`: nombre vacío o con espacios, publicaciones negativas, universidad nula;
- los límites de la política: 3 y 4 publicaciones, score 59 y 60, score nulo, las dos condiciones fallando a la vez;
- la igualdad de las entidades transitorias.

**o) "El nuevo proyecto de tests" no existe.** Ya existen `PeerReview.Domain.UnitTests` y `PeerReview.Application.UnitTests`; no hay ninguno para Infrastructure. Además, `AGENTS.md` dice "un proyecto de tests por capa, que referencia solo el proyecto que prueba". O pides crear `PeerReview.Infrastructure.IntegrationTests` y actualizar `AGENTS.md`, o dices que en este paso no se prueban los repositorios.

**p) "El `grep` del primer paso" depende de un contexto que el agente quizá no tiene.** Cita la sección *Verification commands* de `apps/api/AGENTS.md` y pide los comandos exactos del CI, desde `apps/api` y sobre `PeerReview.slnx`:
- `dotnet format whitespace` y `dotnet format style` con `--verify-no-changes`;
- `dotnet build -c Release`;
- `dotnet test -c Release`.

Añade también `dotnet list src/PeerReview.Application package`, para comprobar que no se cuela EF Core en Application.

**q) La rama base.** Ahora mismo estás en `chore/ci-workflow`. Si no lo indicas, `feat/domain-model` saldrá de ahí y arrastrará los commits del CI. Pon: *"crea `feat/domain-model` desde `main`"*, o desde donde tú quieras que salga.

**r) Un commit o varios.** ODD cierra cada tarea con un commit, pero tu prompt da un único mensaje de commit. Aclara si quieres un solo commit o uno por tarea (shared kernel / entidades / política / persistencia), cada uno con su mensaje.

**s) La composición en la Api.** No queda claro si `Program.cs` debe llamar ya a `AddInfrastructure()` o eso va en el paso de endpoints. Dilo. Añade también que el DbContext se registra como scoped, con un nombre de base de datos fijo.

## 4. Mejoras menores

- Corrige "refla" → "regla" y "manana" → "mañana".
- Pon el contrato del API en un bloque de código normal, no entre `<< >>`.
- Separa en secciones claras qué está **decidido**, qué es **pregunta abierta** y qué **fase de parada** tiene el agente. Así se ve de un vistazo qué puede decidir él y qué no.

Si quieres, te devuelvo el prompt reescrito con todo esto ya aplicado.

<a id="human-decision-uuid-identifiers"></a>
> **Human decision:** Chose to switch entity identifiers to domain-generated UUID v7, a deliberate departure from the assignment's literal `int UserId`, to be justified in the README.

## Human

reescribeme el prompt y ademas vamos a tratar de usar uuid en los identificadores tenlo en cuenta para el prompt

## Assistant

Aquí tienes el prompt reescrito, con UUID y con los puntos de la revisión anterior ya resueltos:

> **Changes proposed:**
> - Identifiers move from database-generated `int` to domain-generated UUID v7 (`Guid`), created in the entity factory; the Frontiers organization id becomes a business key (`FrontiersOrganizationId`) instead of the identity.
> - Adds a `SharedKernel` `ErrorType` enum and clarifies `Error.Code`/`Message`/`Type`, so `code` is a Problem Details extension and `type` stays a URI.
> - Locks in the earlier review's recommendations as decided: return every failing eligibility reason (not just the first), don't persist an "invitation", use the `Score` captured at registration time, and apply mypy-safe naming aligned with the JSON contract casing.
> - Replaces the ambiguous "wait for my confirmation" with an explicit "Fase 1: propuesta" step that must stop and wait for a reply before any code is written.
> - Splits the single commit message into four Conventional Commits, one per work unit, and pins the branch to be created from `main` explicitly.
> - Adds an `PeerReview.Infrastructure.IntegrationTests` project and updates `AGENTS.md` accordingly; treats every contract field as possibly null given the Swagger gaps.

````markdown
# Contexto

Vamos a implementar la prueba técnica por pasos. Este es el **paso 2: modelo de dominio y persistencia
en memoria**. Trabaja desde `apps/api` y sigue `apps/api/AGENTS.md` (capas, Screaming Architecture,
Central Package Management y comandos de verificación). Si algo de este prompt contradice
`AGENTS.md`, para y avísame.

## Dominio completo (solo contexto: NO lo implementes entero)

- `RegisterUser(UserName, UniversityName, NumberOfPublications)`: registra un usuario. Con
  `UniversityName` se consulta el API de organizaciones de Frontiers (`Organization_ElasticSuggest`,
  `maxcount=1`) para obtener los datos de la universidad. El usuario y su universidad se guardan en
  una base de datos en memoria.
- `InviteReviewer(UserId)`: evalúa si un usuario puede ser invitado a revisar un artículo. Tiene éxito
  si `NumberOfPublications > 3` **y** el `Score` de su universidad es `>= 60`.
- En los dos casos se devuelve un resultado que entienda tanto una persona (cliente web) como una
  máquina (otro servicio): un código estable y un mensaje legible.

# Decisiones ya tomadas (no las cambies)

## Identificadores: UUID

- Todas las entidades usan `Guid` como identidad (`UserId`, `UniversityId`), generado por el
  **dominio** en la factoría con `Guid.CreateVersion7()` (UUID v7, ordenable en el tiempo). La base de
  datos NO genera ids (`ValueGeneratedNever`).
- Nos desviamos a propósito del enunciado, que define `InviteReviewer(int UserId)`. El motivo: los ids
  no son enumerables ni revelan cuántos usuarios hay, se conocen antes de persistir y no dependen del
  proveedor de datos. Anota esta decisión en el resumen final para documentarla en el README.
- Como la identidad existe desde la creación, `Entity<TId>` compara por `Id` sin tener que tratar
  entidades transitorias.
- El `id` de la organización en Frontiers NO es la identidad de `University`: es una **clave de
  negocio** (`FrontiersOrganizationId`) única por universidad. Varios usuarios de la misma universidad
  comparten la misma `University` y la localizan por esa clave.

## Firma de los casos de uso (paso posterior, solo para que el diseño encaje)

- Cada caso de uso recibirá un único objeto con propiedades nombradas (`RegisterUserCommand`,
  `InviteReviewerCommand`), no una lista de parámetros posicionales. En este paso, `User.Create`
  recibe argumentos nombrados.
- "Invitar" = **evaluar la elegibilidad**. No existen `Article` ni `Invitation` y no se persiste
  ninguna invitación.
- La elegibilidad usa el `Score` guardado al registrar el usuario (una foto de ese momento), no se
  vuelve a consultar Frontiers al invitar.

## Estándar de API (se implementa en el paso de endpoints, pero condiciona el diseño)

- OpenAPI 3.1 con el soporte nativo de .NET 10 (`Microsoft.AspNetCore.OpenApi`). Errores como
  Problem Details (RFC 9457).
- Las propiedades del dominio coinciden con las del contrato **salvo en mayúsculas/minúsculas**
  (`UserName` en C# ↔ `userName` en JSON, vía System.Text.Json). En C# se usa PascalCase.
- `Error` tiene:
  - `Code`: estable, legible y con el nombre exacto de la propiedad, p. ej.
    `User.UserNameRequired`. Irá como extensión `code` de Problem Details, **no** como `type`
    (`type` es una URI).
  - `Message`: en inglés.
  - `Type` (enum `ErrorType`: `Validation`, `NotFound`, `Conflict`, `Failure`): permitirá mapear
    después el status HTTP sin lógica adicional.

# Alcance de este paso

SOLO:

1. Las abstracciones del shared kernel (`Entity<TId>`, `Error`, `ErrorType`, `Result`, `Result<T>`).
2. Las entidades `User` y `University` con sus invariantes.
3. La regla de elegibilidad de revisores como lógica de dominio pura.
4. Los puertos de persistencia en Application y su implementación con EF Core InMemory.

Fuera de alcance: handlers/casos de uso, cliente HTTP de Frontiers y su DTO, endpoints, OpenAPI,
llamar a `AddInfrastructure()` desde `Program.cs`, frontend y Docker.

# Contrato del API externo (`Organization_ElasticSuggest`)

```
GET ?query=<string, required>&maxcount=<integer>
200 OK:
[
  {
    "id": 0, "organizationName": "string", "matchedName": "string",
    "country": "string", "countryIsoCode": "string", "city": "string",
    "street": "string", "zipCode": "string", "state": "string",
    "webDomain": "string", "type": "string", "score": 0
  }
]
```

El Swagger no indica qué campos pueden ser nulos. Trátalos todos como posiblemente nulos o ausentes.
El dominio NO replica este modelo: `University` contiene solo lo que necesita el negocio
(`FrontiersOrganizationId`, `Name`, `Score` y lo que justifiques). El DTO se creará en Infrastructure
en un paso posterior, como capa anticorrupción.

# Fase 1: propuesta (PARA al terminar, sin escribir código)

Entrega en **un solo mensaje**:

1. La tabla de mapeo contrato → `University`: campo, tipo C#, si es nullable y por qué.
2. El tipo de `Score` (`int` o `decimal`) con su justificación, sabiendo que el contrato solo muestra
   `0`.
3. Las firmas públicas previstas de `User`, `University`, `ReviewerEligibilityPolicy` y
   `ReviewerEligibility`.
4. La lista de dudas pendientes: longitudes máximas, rango válido del `Score`, reglas sobre el nombre
   de la universidad… No inventes reglas: pregúntalas aquí.

Luego **detente y espera mi respuesta**. No escribas código hasta entonces.

# Fase 2: implementación (tras mi confirmación)

## Domain (`PeerReview.Domain`, sin referencias ni paquetes NuGet)

```
PeerReview.Domain/
├─ SharedKernel/        # Única carpeta no nombrada por negocio
│  ├─ Entity.cs         # Entity<TId>: identidad e igualdad por Id
│  ├─ Error.cs          # record Error(Code, Message, Type)
│  ├─ ErrorType.cs
│  └─ Result.cs         # Result y Result<T>, sin excepciones para errores de negocio
├─ Users/
│  ├─ User.cs
│  └─ UserErrors.cs
├─ Universities/
│  ├─ University.cs
│  └─ UniversityErrors.cs
└─ Reviewers/
   ├─ ReviewerEligibilityPolicy.cs
   └─ ReviewerEligibility.cs
```

- Las entidades se crean con factorías estáticas (`User.Create(...)`, `University.Create(...)`) que
  devuelven `Result<T>`. Constructores privados y setters privados. Deja un constructor sin
  parámetros privado solo si EF lo necesita, y coméntalo.
- Invariantes mínimas:
  - `UserName`: obligatorio; se guarda sin espacios al inicio ni al final; si solo tiene espacios, es
    un error.
  - `NumberOfPublications`: `>= 0`.
  - `University`: obligatoria para el usuario.
  - `FrontiersOrganizationId`: obligatorio (y positivo, si lo confirmo en la fase 1).
  - `Score`: nullable. Nulo significa desconocido.
- `ReviewerEligibilityPolicy`:
  - Es pura y sin estado, y evalúa un `User` (con su `University`).
  - Regla: `NumberOfPublications > MinimumPublicationsExclusive (3)` y
    `Score >= MinimumUniversityScore (60)`, con constantes con nombre y sin números mágicos.
  - `ReviewerEligibility` indica si es elegible y **todos** los motivos incumplidos, no solo el
    primero: `InsufficientPublications`, `InsufficientUniversityScore`, `UnknownUniversityScore`.
    Cada motivo tiene su `Error` con código estable (p. ej. `Reviewer.InsufficientPublications`).

## Application (`PeerReview.Application`, solo depende de Domain)

```
PeerReview.Application/Abstractions/Persistence/
├─ IRepository.cs            # IRepository<TEntity, TId>: GetByIdAsync, AddAsync
├─ IUnitOfWork.cs            # SaveChangesAsync
├─ IUserRepository.cs        # : IRepository<User, Guid>
└─ IUniversityRepository.cs  # : IRepository<University, Guid> + GetByFrontiersOrganizationIdAsync
```

- Mínimo imprescindible: sin `Update`, `Delete`, `GetAll` ni `IQueryable` expuestos.
- Todos los métodos asíncronos reciben `CancellationToken`.
- Ningún tipo de EF Core aparece en Application.

## Infrastructure (`PeerReview.Infrastructure`)

```
PeerReview.Infrastructure/
├─ Persistence/
│  ├─ PeerReviewDbContext.cs     # Implementa IUnitOfWork
│  ├─ Configurations/
│  │  ├─ UserConfiguration.cs
│  │  └─ UniversityConfiguration.cs
│  └─ Repositories/
│     ├─ Repository.cs           # Base genérica
│     ├─ UserRepository.cs
│     └─ UniversityRepository.cs
└─ DependencyInjection.cs        # Completa AddInfrastructure()
```

- Añade `Microsoft.EntityFrameworkCore.InMemory` con la versión en `Directory.Packages.props`, nunca
  en el `.csproj`.
- Mapeo con Fluent API (`IEntityTypeConfiguration<T>`), nunca con atributos en el dominio. Los ids
  llevan `ValueGeneratedNever()`.
- El índice único sobre `FrontiersOrganizationId` va declarado, pero el proveedor InMemory **no lo
  aplica**. No lo cuentes como garantía de "no duplicar": esa garantía (get-or-create) llega con el
  handler. Déjalo anotado.
- `DbContext` registrado como scoped, con un nombre de base de datos fijo en una constante.

## Tests (TDD estricto: RED → GREEN → REFACTOR, muéstrame el RED observado)

Framework: xUnit. Los tests replican las carpetas de negocio (`Users/`, `Universities/`,
`Reviewers/`).

- `PeerReview.Domain.UnitTests` (ya existe):
  - Invariantes de `User.Create`: nombre nulo, vacío, solo espacios y con espacios en los bordes
    (se recortan); publicaciones negativas; universidad nula.
  - Invariantes de `University.Create`.
  - `Guid` v7 distinto en cada creación.
  - Igualdad de entidades por `Id`.
  - Política: 3 y 4 publicaciones; score 59, 60 (y 59.9 si es `decimal`); score nulo → no elegible
    con `UnknownUniversityScore`; las dos condiciones fallando → se devuelven los dos motivos.
- Crea `PeerReview.Infrastructure.IntegrationTests`, que referencia solo Infrastructure, y
  añádelo a `PeerReview.slnx`:
  - Guardar y recuperar un `User` con su `University`.
  - `GetByFrontiersOrganizationIdAsync` encuentra la universidad existente.
  - Dos usuarios comparten la misma `University` si se reutiliza la instancia.
  - Actualiza la sección *Tests* de `apps/api/AGENTS.md` con este nuevo proyecto.

# Verificación (desde `apps/api`, igual que el CI)

Muéstrame la salida de:

1. `dotnet format whitespace PeerReview.slnx --verify-no-changes` y
   `dotnet format style PeerReview.slnx --verify-no-changes`.
2. `dotnet build PeerReview.slnx -c Release`: 0 errores, 0 warnings.
3. `dotnet test PeerReview.slnx -c Release`: todos los tests en verde.
4. La regla de dependencia:
   - Los cuatro `dotnet list src/<proyecto> reference` de la sección *Verification commands* de
     `AGENTS.md`.
   - `dotnet list src/PeerReview.Domain package`: debe salir vacío.
   - `dotnet list src/PeerReview.Application package`: sin EF Core.
   - `dotnet list tests/PeerReview.Infrastructure.IntegrationTests reference`: solo Infrastructure.
   - `grep -rE "using PeerReview\.(Infrastructure|Api)|Microsoft\.EntityFrameworkCore" src/PeerReview.Domain src/PeerReview.Application`:
     debe salir vacío.

# Entrega

- Crea la rama `feat/domain-model` **desde `main`**, no desde la rama actual.
- Registra el progreso en `odd/tasks/domain-model.md`.
- Un commit por unidad de trabajo, con sus tests, en Conventional Commits:
  1. `feat(api): add domain shared kernel`
  2. `feat(api): add user and university entities`
  3. `feat(api): add reviewer eligibility policy`
  4. `feat(api): add in-memory persistence`
- **No hagas push.**
- Termina con un resumen de las decisiones de diseño que no estuvieran en este prompt, incluida la
  justificación del paso de `int` a `Guid` para el README.
````

Cambios respecto a tu versión que conviene revisar:

- **UUID v7 generado en el dominio, no en la base de datos.** Así el id existe desde la creación, la igualdad por `Id` funciona sin casos especiales y el proveedor InMemory no genera nada. El id de Frontiers pasa a ser una clave de negocio (`FrontiersOrganizationId`), y eso es lo que da sentido a `GetByFrontiersOrganizationIdAsync`.
- **Te apartas del enunciado (`int UserId`).** Lo dejo explícito y con su justificación para el README, porque quien evalúe la prueba lo va a notar.
- **Mis recomendaciones de la revisión anterior entran como decisiones ya tomadas:**
  - devolver todos los motivos de no elegibilidad;
  - no persistir invitaciones;
  - usar el `Score` guardado al registrar;
  - `ErrorType` en `Error`;
  - `code` como extensión de Problem Details, no como `type`.

  Si alguna no te convence, cámbiala antes de lanzar el prompt.
- **Commits:** he pasado de uno solo a cuatro, uno por unidad de trabajo. Si prefieres uno solo, sustituye esa lista por tu mensaje original.

## Human

```text

4. Dudas pendientes

  1. UserName:
     - ¿Longitud máxima? ¿Y mínima, aparte de "no vacío"?
     - ¿Debe ser único entre usuarios? Si lo es, hace falta un error Conflict y un método en el repositorio.
  2. NumberOfPublications: ¿tiene límite superior o basta con >= 0?
  3. FrontiersOrganizationId: ¿lo exijo positivo (> 0)? ¿Y es int (int32) o puede ser long? El Swagger no indica format.
  4. Rango del Score:
     - ¿Es 0–100? ¿Rechazo valores negativos o mayores de 100 con University.ScoreOutOfRange, o acepto cualquier número?
     - ¿Seguro que es una calificación de la universidad y no la relevancia de Elasticsearch? El endpoint se llama ElasticSuggest y
       en Elastic score suele ser la relevancia, que no tiene límite. Esto también afecta al rango.
  5. Nombre de la universidad:
     - ¿Es obligatorio?
     - ¿Se recorta como UserName?
     - ¿Tiene longitud máxima?
     - Si organizationName llega vacío, ¿uso matchedName como alternativa o rechazo el registro?
  6. Foto del Score compartida: como varios usuarios comparten la misma University, la "foto" del score es de la universidad, no del
     usuario. Si un segundo usuario se registra y Frontiers devuelve otro score o nombre, ¿se mantiene lo guardado la primera vez
     (propongo esto) o se actualiza? Afecta al get-or-create del handler y a si University necesita un método de actualización.
  7. ¿La no elegibilidad es un éxito o un error?
     - Opción A: InviteReviewer devuelve éxito con IsEligible = false y los motivos (200).
     - Opción B: devuelve un fallo (p. ej. 422).
     - Además, ¿qué ErrorType llevan los tres motivos? Propongo Validation si es la opción B. No encaja del todo porque el enum no
       tiene BusinessRule.
  8. Errores de Create: ¿basta con devolver el primero (un Error por Result) o quieres que Result acumule varios errores de
     validación?
  9. Dónde van los errores de revisor: el árbol no tiene ReviewerErrors.cs, así que propongo definirlos como estáticos en
     ReviewerEligibility. ¿Prefieres que añada Reviewers/ReviewerErrors.cs para que sea simétrico con UserErrors y UniversityErrors?
  10. Mensajes de error: ¿algún formato concreto? Propongo frases cortas en inglés, p. ej. "User name is required.".
  11. Campos extra de University: ¿alguno de Country, CountryIsoCode o WebDomain debería estar en el dominio para mostrarlo al
      usuario? Mi propuesta es que no.
  12. Commits: tengo guardado "no hacer commits sin tu consentimiento". Entiendo que "un commit por unidad de trabajo" en este
      encargo es ese consentimiento para feat/domain-model. Sin push. ¿Correcto?

```

## Assistant

Las preguntas del agente son buenas. Aquí tienes una respuesta lista para pegarle, con lo que yo elegiría en cada punto. Antes de enviarla, revisa estas cuatro, porque son decisiones de producto tuyas y no técnicas:

- **Punto 1 (longitud y unicidad de `UserName`)**: he puesto 100 caracteres, pero es arbitrario.
- **Punto 4 (Score)**: el agente tiene razón en la sospecha. En `ElasticSuggest`, el `score` casi seguro es la relevancia de Elasticsearch y no una nota de la universidad. Mando el enunciado ("Score de su universidad ≥ 60"), así que se aplica tal cual, pero sin inventar un rango 0–100.
- **Punto 7 (¿no ser elegible es un error?)**: recomiendo tratarlo como un resultado correcto (200), pero un 422 también es defendible.
- **Punto 12 (commits)**: solo tú puedes dar ese consentimiento.

````markdown
Respuestas a tus dudas:

1. UserName: entre 1 y 100 caracteres, medidos después de recortar los espacios de los bordes. Error nuevo:
   `User.UserNameTooLong` (Validation). NO es único: el enunciado no lo pide y la identidad es el `Id`.
   Sin error Conflict ni método nuevo en el repositorio.
2. NumberOfPublications: solo `>= 0`. Sin límite superior.
3. FrontiersOrganizationId: tipo `long` (el Swagger no indica format; `long` evita desbordamientos sin coste)
   y obligatoriamente `> 0`. Error: `University.InvalidFrontiersOrganizationId`.
4. Score:
   - Tipo `decimal?`. Sin límite superior y sin error `ScoreOutOfRange`.
   - Un valor negativo es un error de validación: `University.NegativeScore`.
   - Sabemos que probablemente sea la relevancia de Elasticsearch. Mando el enunciado ("Score de su
     universidad >= 60"), así que se aplica tal cual. Deja esta suposición anotada en el resumen de decisiones
     para el README.
5. Nombre de la universidad: obligatorio, se recorta igual que UserName y tiene como máximo 250 caracteres.
   Errores: `University.NameRequired` y `University.NameTooLong`. Qué hacer si `organizationName` llega vacío
   lo decidirá la capa anticorrupción en un paso posterior: allí se rechazará, sin usar `matchedName`
   (puede ser un alias). En este paso no afecta al dominio.
6. Foto del score: se mantiene lo guardado la primera vez. University no tiene método de actualización.
   El get-or-create del handler reutilizará la existente.
7. Opción A: la no elegibilidad es un resultado correcto (`IsEligible = false` más los motivos), no un error.
   Los `Error`/`Result` se reservan para validación, no encontrado, etc. Por eso los motivos NO son `Error`:
   usa un record `IneligibilityReason(Code, Message)` en `Reviewers/`, con códigos estables
   (`Reviewer.InsufficientPublications`, `Reviewer.InsufficientUniversityScore`,
   `Reviewer.UnknownUniversityScore`). No añadas `BusinessRule` a `ErrorType`.
8. Acumula todos los errores de validación en las factorías: el formulario web podrá mostrarlos todos y
   Problem Details los expondrá en `errors`. Hazlo lo más simple posible, p. ej. un `ValidationError : Error`
   con una lista `Errors`, sin cambiar la forma de `Result`.
9. Crea `Reviewers/ReviewerErrors.cs` (o `ReviewerIneligibilityReasons.cs`, si con el punto 7 ya no son
   `Error`) para que sea simétrico con Users y Universities.
10. De acuerdo: frases cortas en inglés que terminan en punto, p. ej. "User name is required.". Cuando aporte
    algo, incluye el límite en el mensaje: "User name must be at most 100 characters.".
11. De acuerdo: ningún campo extra en el dominio.
12. Correcto: este encargo es mi consentimiento para hacer commits en `feat/domain-model`, uno por unidad de
    trabajo, creada desde `main`. Sin push.

Con esto, pasa a la fase 2.
````

Cuatro de estas respuestas cambian lo que decía el prompt original:

- **Tipo del identificador de Frontiers**: `long` en lugar de `int`.
- **Motivos de no elegibilidad**: ya no son `Error`, sino un record propio (`IneligibilityReason`). Por eso se ajusta el nombre del archivo del punto 9.
- **Errores de validación**: se acumulan todos en lugar de devolver solo el primero.
- **Errores nuevos**: longitud máxima del nombre de usuario, nombre de la universidad y score negativo.

Si no quieres alguna, cámbiala antes de enviarla.

## Human

Podemos ir trabajando en el frontend? esta es la tarea 


```text

Hello!

This is a small homework for Frontiers for the position you applied. We hope you will have fun with it and we are curious to
see how you approach these tasks. Happy prompting!
• Create a web API called „RegisterUser(string UserName, string UniversityName, int NumberOfPublications)”.
• Using the following endpoint get some more information regarding the university the user provided.
o https://organizations-api.frontiersin.org/swagger/ui/index#!/Organization/Organization_ElasticSuggest
, Pass for the query input the UniversityName and limit the response to 1.

• Save the new user and the university to an In-Memory database.
• Create another Api called „InviteReviewer(int UserId)”. That will be used to invite someone to review a paper
before we publish it. If the user has NumberOfPublications > 3 and University Score >= 60 return a user friendly
message that invitation was successfull otherwise the opposite.
• Dockerize the application and add some unit tests.
• Write a simple frontend in vue3 which can call the backend endpoints you created previously and can be used by
users.

How to submit
Share with us your solution (link to your github) and a ReadMe file also describing how to build and run it.
Make sure you include your history of prompts, so we can see how you used AI and also tell us the LLM model you picked
and why!
If you will reach a point where AI get stuck and you prefer to code it without AI, please also mention it, and explain.

```

_(1 tool calls: 1 Bash)_

## Assistant

Sí, se puede empezar ya, pero hay un requisito previo y un riesgo operativo:

**1. El frontend necesita un contrato HTTP que todavía no existe.** El scaffold de `apps/web` ya está: FSD con los slices `register-user`, `invite-reviewer`, `user` y `university`, un `httpClient` mínimo y páginas vacías. Pero los tipos actuales (`User`, `University`) son provisionales: no tienen `id` y no reflejan las decisiones que acabas de tomar (UUID, motivos de no elegibilidad, Problem Details). Si el frontend empieza sin contrato, lo acabará inventando y chocará con lo que salga del backend. Lo sensato es **fijar primero el contrato**, que es pequeño, y después construir contra él con `fetch` simulado en los tests. Una propuesta:

| operationId | Método y ruta | Petición | Respuesta correcta | Errores (Problem Details) |
|---|---|---|---|---|
| `RegisterUser` | `POST /users` | `{ userName, universityName, numberOfPublications }` | `201` + `Location` + `{ userId, userName, numberOfPublications, university: { name, score } }` | `400` validación (con `errors` por campo), `404` universidad no encontrada en Frontiers, `502` Frontiers no responde |
| `InviteReviewer` | `POST /users/{userId}/reviewer-invitation` | — | `200` + `{ userId, isEligible, message, reasons: [{ code, message }] }` | `400` id mal formado, `404` usuario no encontrado |

- Los `operationId` coinciden con los nombres del enunciado, así que quien evalúe los reconoce directamente en el OpenAPI.
- `isEligible: false` devuelve 200, como decidiste en el punto 7.
- El `message` legible lo genera el backend y el frontend lo muestra tal cual. Así, el día que el cliente sea una máquina, usará `isEligible` y `reasons[].code`.

**2. No conviene trabajar en este mismo directorio.** Ahora mismo el checkout está en `feat/domain-model`, donde el otro agente está trabajando. Si alguien toca el frontend aquí, cambia de rama bajo sus pies o mezcla commits. El frontend debería ir en un worktree aparte (p. ej. `../frontiers-ai-augmented-software-homework-worktrees/feat-web-register-user`), en su propia rama creada desde `main`.

Un recordatorio: el enunciado dice explícitamente `InviteReviewer(int UserId)`, y en el frontend el UUID se va a ver en la URL y en el campo de entrada. Encaja con lo que decidiste, pero confirma que el README lo justifica.

¿Cómo quieres hacerlo?

- **A)** Te redacto el prompt para el otro agente, como hasta ahora: contrato primero y después el frontend por pasos. Es lo que recomiendo, por coherencia con el historial de prompts que tienes que entregar.
- **B)** Lo implemento yo aquí, en un worktree aparte, empezando por el contrato.

Y si el contrato de la tabla te vale tal cual o quieres cambiar algo, dímelo junto con la respuesta.

_[Stop hook: RDD asked to run the review preflight for the new commit]_


_[Gentle AI review consent: Revisar este cambio]_


## Assistant

Aceptaste la revisión, pero no la he iniciado. Al intentarlo, el START falló (`invalid_request`) porque había archivos sin seguimiento sin declarar. Al repetir la comprobación, el estado del repositorio ya era otro: en esta carpeta el otro agente está en plena tarea 4 (persistencia InMemory) en `feat/domain-model`. Ahora mismo hay:

- 4 archivos modificados: `Directory.Packages.props`, `PeerReview.slnx`, `PeerReview.Infrastructure.csproj` y el `.gitkeep` borrado de `Persistence/`;
- 10 archivos nuevos: `PeerReviewDbContext`, las configuraciones, los repositorios y el proyecto `PeerReview.Infrastructure.IntegrationTests` con sus tests.

La herramienta de revisión pide ahora que elija qué archivos nuevos entran en la revisión. No lo he hecho, por dos motivos:

1. **El trabajo no está terminado.** El otro agente sigue escribiendo. Revisar ahora congelaría un estado a medias, y cualquier archivo que escriba después invalidaría la revisión.
2. **Elegir qué archivos entran le corresponde a quien hace el trabajo.** Yo no escribí esos cambios, así que no me toca decidir cuáles forman parte de la unidad de trabajo.

**Lo que recomiendo:** esperar a que el otro agente haga el commit de persistencia (`feat(api): add in-memory persistence`) y revisar ese commit, no los cambios en curso. De paso, conviene que ese agente lance la revisión sobre su propio commit, y así no dependemos de esta sesión.

Esto confirma que no hay que trabajar el frontend en esta misma carpeta. Queda pendiente tu respuesta a la pregunta anterior:

- **A)** Te redacto el prompt del frontend para el otro agente, empezando por el contrato.
- **B)** Lo implemento yo aquí, en un worktree aparte.

Y si la tabla del contrato te vale tal cual.
