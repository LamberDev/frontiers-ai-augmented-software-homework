# Session 2026-09-25: domain model

Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).
Model thinking, raw tool output and harness attachments are omitted; tool calls
are summarised as counts, and review and memory bookkeeping is omitted.

## Human

```text

Vamos a implementar la prueba técnica por pasos.

## Dominio completo (solo contexto: NO lo implementes entero)

- **`RegisterUser(UserName, UniversityName, NumberOfPublications)`**: registra un usuario. Con `UniversityName` se consulta el API de organizaciones de Frontiers (`Organization_ElasticSuggest`, `maxcount=1`) para obtener los datos de la universidad. El usuario y su universidad se guardan en una base de datos en memoria.
- **`InviteReviewer(UserId)`**: evalúa si un usuario puede ser invitado a revisar un artículo. Tiene éxito si `NumberOfPublications > 3` **y** el `Score` de su universidad es `>= 60`.
- En los dos casos se devuelve un resultado que entienda tanto una persona (cliente web) como una máquina (otro servicio): un código estable y un mensaje legible.

## Decisiones ya tomadas (no las cambies)

### Identificadores: UUID

- Todas las entidades usan `Guid` como identidad (`UserId`, `UniversityId`), generado por el **dominio** en la factoría con `Guid.CreateVersion7()` (UUID v7, ordenable en el tiempo). La base de datos NO genera ids (`ValueGeneratedNever`).
- Nos desviamos a propósito del enunciado, que define `InviteReviewer(int UserId)`. El motivo: los ids no son enumerables ni revelan cuántos usuarios hay, se conocen antes de persistir y no dependen del proveedor de datos. Anota esta decisión en el resumen final para documentarla en el README.
- Como la identidad existe desde la creación, `Entity<TId>` compara por `Id` sin tener que tratar entidades transitorias.
- El `id` de la organización en Frontiers NO es la identidad de `University`: es una **clave de negocio** (`FrontiersOrganizationId`) única por universidad. Varios usuarios de la misma universidad comparten la misma `University` y la localizan por esa clave.

### Firma de los casos de uso (paso posterior, solo para que el diseño encaje)

- Cada caso de uso recibirá un único objeto con propiedades nombradas (`RegisterUserCommand`, `InviteReviewerCommand`), no una lista de parámetros posicionales. En este paso, `User.Create` recibe argumentos nombrados.
- "Invitar" = **evaluar la elegibilidad**. No existen `Article` ni `Invitation` y no se persiste ninguna invitación.
- La elegibilidad usa el `Score` guardado al registrar el usuario (una foto de ese momento); no se vuelve a consultar Frontiers al invitar.

### Estándar de API (se implementa en el paso de endpoints, pero condiciona el diseño)

- OpenAPI 3.1 con el soporte nativo de .NET 10 (`Microsoft.AspNetCore.OpenApi`). Errores como Problem Details (RFC 9457).
- Las propiedades del dominio coinciden con las del contrato **salvo en mayúsculas/minúsculas** (`UserName` en C# ↔ `userName` en JSON, vía System.Text.Json). En C# se usa PascalCase.
- `Error` tiene:
  - **`Code`**: estable, legible y con el nombre exacto de la propiedad, p. ej. `User.UserNameRequired`. Irá como extensión `code` de Problem Details, **no** como `type` (`type` es una URI).
  - **`Message`**: en inglés.
  - **`Type`** (enum `ErrorType`: `Validation`, `NotFound`, `Conflict`, `Failure`): permitirá mapear después el status HTTP sin lógica adicional.

## Alcance de este paso

SOLO:

1. Las abstracciones del shared kernel (`Entity<TId>`, `Error`, `ErrorType`, `Result`, `Result<T>`).
2. Las entidades `User` y `University` con sus invariantes.
3. La regla de elegibilidad de revisores como lógica de dominio pura.
4. Los puertos de persistencia en Application y su implementación con EF Core InMemory.

**Fuera de alcance:** handlers/casos de uso, cliente HTTP de Frontiers y su DTO, endpoints, OpenAPI, llamar a `AddInfrastructure()` desde `Program.cs`, frontend y Docker.

## Contrato del API externo (`Organization_ElasticSuggest`)

```http
GET ?query=<string, required>&maxcount=<integer>
```

Respuesta `200 OK`:

```json
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
```

- El Swagger no indica qué campos pueden ser nulos. Trátalos todos como posiblemente nulos o ausentes.
- El dominio NO replica este modelo: `University` contiene solo lo que necesita el negocio (`FrontiersOrganizationId`, `Name`, `Score` y lo que justifiques).
- El DTO se creará en Infrastructure en un paso posterior, como capa anticorrupción.

---

## Fase 1: propuesta (PARA al terminar, sin escribir código)

Entrega en **un solo mensaje**:

1. La tabla de mapeo contrato → `University`: campo, tipo C#, si es nullable y por qué.
2. El tipo de `Score` (`int` o `decimal`) con su justificación, sabiendo que el contrato solo muestra `0`.
3. Las firmas públicas previstas de `User`, `University`, `ReviewerEligibilityPolicy` y `ReviewerEligibility`.
4. La lista de dudas pendientes: longitudes máximas, rango válido del `Score`, reglas sobre el nombre de la universidad… No inventes reglas: pregúntalas aquí.

Luego **detente y espera mi respuesta**. No escribas código hasta entonces.

---

## Fase 2: implementación (tras mi confirmación)

### Domain (`PeerReview.Domain`, sin referencias ni paquetes NuGet)

```text
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

- Las entidades se crean con factorías estáticas (`User.Create(...)`, `University.Create(...)`) que devuelven `Result<T>`. Constructores privados y setters privados. Deja un constructor sin parámetros privado solo si EF lo necesita, y coméntalo.
- **Invariantes mínimas:**
  - `UserName`: obligatorio; se guarda sin espacios al inicio ni al final; si solo tiene espacios, es un error.
  - `NumberOfPublications`: `>= 0`.
  - `University`: obligatoria para el usuario.
  - `FrontiersOrganizationId`: obligatorio (y positivo, si lo confirmo en la fase 1).
  - `Score`: nullable. Nulo significa desconocido.
- **`ReviewerEligibilityPolicy`:**
  - Es pura y sin estado, y evalúa un `User` (con su `University`).
  - Regla: `NumberOfPublications > MinimumPublicationsExclusive (3)` y `Score >= MinimumUniversityScore (60)`, con constantes con nombre y sin números mágicos.
  - `ReviewerEligibility` indica si es elegible y **todos** los motivos incumplidos, no solo el primero: `InsufficientPublications`, `InsufficientUniversityScore`, `UnknownUniversityScore`. Cada motivo tiene su `Error` con código estable (p. ej. `Reviewer.InsufficientPublications`).

### Application (`PeerReview.Application`, solo depende de Domain)

```text
PeerReview.Application/Abstractions/Persistence/
├─ IRepository.cs            # IRepository<TEntity, TId>: GetByIdAsync, AddAsync
├─ IUnitOfWork.cs            # SaveChangesAsync
├─ IUserRepository.cs        # : IRepository<User, Guid>
└─ IUniversityRepository.cs  # : IRepository<University, Guid> + GetByFrontiersOrganizationIdAsync
```

- Mínimo imprescindible: sin `Update`, `Delete`, `GetAll` ni `IQueryable` expuestos.
- Todos los métodos asíncronos reciben `CancellationToken`.
- Ningún tipo de EF Core aparece en Application.

### Infrastructure (`PeerReview.Infrastructure`)

```text
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

- Añade `Microsoft.EntityFrameworkCore.InMemory` con la versión en `Directory.Packages.props`, nunca en el `.csproj`.
- Mapeo con Fluent API (`IEntityTypeConfiguration<T>`), nunca con atributos en el dominio. Los ids llevan `ValueGeneratedNever()`.
- El índice único sobre `FrontiersOrganizationId` va declarado, pero el proveedor InMemory **no lo aplica**. No lo cuentes como garantía de "no duplicar": esa garantía (get-or-create) llega con el handler. Déjalo anotado.
- `DbContext` registrado como scoped, con un nombre de base de datos fijo en una constante.

### Tests (TDD estricto: RED → GREEN → REFACTOR, muéstrame el RED observado)

Framework: xUnit. Los tests replican las carpetas de negocio (`Users/`, `Universities/`, `Reviewers/`).

**`PeerReview.Domain.UnitTests`** (ya existe):

- Invariantes de `User.Create`: nombre nulo, vacío, solo espacios y con espacios en los bordes (se recortan); publicaciones negativas; universidad nula.
- Invariantes de `University.Create`.
- `Guid` v7 distinto en cada creación.
- Igualdad de entidades por `Id`.
- Política: 3 y 4 publicaciones; score 59, 60 (y 59.9 si es `decimal`); score nulo → no elegible con `UnknownUniversityScore`; las dos condiciones fallando → se devuelven los dos motivos.

**`PeerReview.Infrastructure.IntegrationTests`** (nuevo; referencia solo Infrastructure y se añade a `PeerReview.slnx`):

- Guardar y recuperar un `User` con su `University`.
- `GetByFrontiersOrganizationIdAsync` encuentra la universidad existente.
- Dos usuarios comparten la misma `University` si se reutiliza la instancia.
- Actualiza la sección *Tests* de `apps/api/AGENTS.md` con este nuevo proyecto.

---

## Verificación (desde `apps/api`, igual que el CI)

Muéstrame la salida de:

1. **Formato:**

```bash
   dotnet format whitespace PeerReview.slnx --verify-no-changes
   dotnet format style PeerReview.slnx --verify-no-changes
```

2. **Build** (0 errores, 0 warnings):

```bash
   dotnet build PeerReview.slnx -c Release
```

3. **Tests** (todos en verde):

```bash
   dotnet test PeerReview.slnx -c Release
```

4. **Regla de dependencia:**
   - Los cuatro `dotnet list src/<proyecto> reference` de la sección *Verification commands* de `AGENTS.md`.
   - `dotnet list src/PeerReview.Domain package` → debe salir vacío.
   - `dotnet list src/PeerReview.Application package` → sin EF Core.
   - `dotnet list tests/PeerReview.Infrastructure.IntegrationTests reference` → solo Infrastructure.
   - Debe salir vacío:

```bash
     grep -rE "using PeerReview\.(Infrastructure|Api)|Microsoft\.EntityFrameworkCore" src/PeerReview.Domain src/PeerReview.Application
```

---

## Entrega

- Crea la rama `feat/domain-model` **desde `main`**, no desde la rama actual.
- Registra el progreso en `odd/tasks/domain-model.md`.
- Un commit por unidad de trabajo **No hagas push.**

```

_(2 tool calls: 2 Bash)_

## Assistant

# Fase 1: propuesta de modelo de dominio

He revisado `apps/api`: el esqueleto de capas ya existe con carpetas `.gitkeep` y `AddInfrastructure()` está vacío. El build usa `TreatWarningsAsErrors` y Central Package Management. Todavía no he escrito código ni creado la rama.

## 1. Mapeo contrato → `University`

| Campo del contrato | Propiedad en `University` | Tipo C# | ¿Nullable en el dominio? | Motivo |
|---|---|---|---|---|
| `id` | `FrontiersOrganizationId` | `int` | **No** | Es la clave de negocio única y sin ella no se puede encontrar ni compartir la universidad. El DTO la tendrá como `int?`; si llega nula, el handler rechaza el registro y no se llega a crear la `University`. Uso `int` porque el ejemplo es `0` y no hay `format` (ver duda 3). |
| `organizationName` | `Name` | `string` | **No** | Es el nombre canónico de la organización y lo necesitan el negocio y la persona usuaria. Una universidad sin nombre no tiene sentido. |
| `score` | `Score` | `decimal` | **Sí** | Tal como decidiste, nulo = desconocido. La política lo trata con el motivo `UnknownUniversityScore`, sin convertirlo en 0. |
| `matchedName` | — | — | — | Es el texto que coincidió con la búsqueda y describe la consulta, no la universidad. Podría servir de nombre alternativo (duda 5). |
| `country`, `countryIsoCode`, `city`, `street`, `zipCode`, `state`, `webDomain`, `type` | — | — | — | Ninguna regla de negocio los usa. Siguiendo YAGNI, se quedan en el DTO anticorrupción (duda 11). |

Además, `University` tendrá `Id: Guid`, que es su identidad propia (UUID v7 generado en la factoría).

## 2. Tipo de `Score`: `decimal?`

- **No pierde información:** JSON solo define "número". Que el ejemplo sea `0` no garantiza que siempre llegue un entero. Si fuera `int`, un `59.9` haría fallar la deserialización (System.Text.Json lanza una excepción con valores fraccionarios en `int`) o, con un conversor, se truncaría. Cualquiera de las dos cosas cambia la decisión de elegibilidad. `decimal` acepta enteros y decimales tal cual.
- **Comparación exacta con el umbral:** a diferencia de `double`, no hay errores binarios (`59.99999…` frente a `60`). Así la frontera `>= 60` es exacta y se puede probar con 59, 59.9 y 60.
- **Es un valor de negocio, no una medida física:** lo que se compara es un umbral, por lo que `decimal` es el tipo más adecuado.
- **Coste:** es algo más caro que `int`, pero aquí no importa.

## 3. Firmas públicas previstas

```csharp
// SharedKernel
public abstract class Entity<TId> : IEquatable<Entity<TId>> where TId : notnull
{
    public TId Id { get; }                       // private init
    protected Entity(TId id);
    public bool Equals(Entity<TId>? other);      // mismo tipo concreto + mismo Id
    public override bool Equals(object? obj);
    public override int GetHashCode();
    public static bool operator ==(Entity<TId>? left, Entity<TId>? right);
    public static bool operator !=(Entity<TId>? left, Entity<TId>? right);
}

public enum ErrorType { Validation, NotFound, Conflict, Failure }
public sealed record Error(string Code, string Message, ErrorType Type);

public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure { get; }
    public Error? Error { get; }                 // null cuando IsSuccess
    public static Result Success();
    public static Result Failure(Error error);
    public static Result<T> Success<T>(T value);
    public static Result<T> Failure<T>(Error error);
}
public sealed class Result<T> : Result
{
    public T Value { get; }                      // lanza InvalidOperationException si IsFailure (error de programación, no de negocio)
}

// Universities
public sealed class University : Entity<Guid>
{
    public int FrontiersOrganizationId { get; private set; }
    public string Name { get; private set; }
    public decimal? Score { get; private set; }
    public static Result<University> Create(int frontiersOrganizationId, string? name, decimal? score);
}
public static class UniversityErrors
{
    public static readonly Error FrontiersOrganizationIdInvalid; // University.FrontiersOrganizationIdInvalid
    public static readonly Error NameRequired;                   // University.NameRequired
    // + ScoreOutOfRange si confirmas un rango (duda 4)
}

// Users
public sealed class User : Entity<Guid>
{
    public string UserName { get; private set; }
    public int NumberOfPublications { get; private set; }
    public Guid UniversityId { get; private set; }
    public University University { get; private set; }
    public static Result<User> Create(string? userName, int numberOfPublications, University? university);
}
public static class UserErrors
{
    public static readonly Error UserNameRequired;               // User.UserNameRequired
    public static readonly Error NumberOfPublicationsNegative;   // User.NumberOfPublicationsNegative
    public static readonly Error UniversityRequired;             // User.UniversityRequired
}

// Reviewers
public static class ReviewerEligibilityPolicy
{
    public const int MinimumPublicationsExclusive = 3;
    public const decimal MinimumUniversityScore = 60m;
    public static ReviewerEligibility Evaluate(User user);       // ArgumentNullException si user es null
}
public sealed class ReviewerEligibility
{
    public bool IsEligible { get; }              // == Reasons.Count == 0
    public IReadOnlyList<Error> Reasons { get; } // todos los motivos incumplidos, en orden estable
    public static readonly Error InsufficientPublications;     // Reviewer.InsufficientPublications
    public static readonly Error InsufficientUniversityScore;  // Reviewer.InsufficientUniversityScore
    public static readonly Error UnknownUniversityScore;       // Reviewer.UnknownUniversityScore
}
```

Notas de diseño:
- **La política es una `static class`:** es pura y no tiene estado, así que no hace falta inyectarla.
- **EF y el constructor privado:** EF no puede pasar la navegación `University` por constructor. Por eso `User` y `University` tendrán un constructor privado sin parámetros comentado "EF Core only".
- **Si se incumplen varias invariantes en `Create`**, se devuelve la primera. Esto va con que `Result` lleve un solo `Error` (duda 8).

## 4. Dudas pendientes

1. **`UserName`:**
   - ¿Longitud máxima? ¿Y mínima, aparte de "no vacío"?
   - ¿Debe ser único entre usuarios? Si lo es, hace falta un error `Conflict` y un método en el repositorio.
2. **`NumberOfPublications`:** ¿tiene límite superior o basta con `>= 0`?
3. **`FrontiersOrganizationId`:** ¿lo exijo **positivo** (`> 0`)? ¿Y es `int` (int32) o puede ser `long`? El Swagger no indica `format`.
4. **Rango del `Score`:**
   - ¿Es 0–100? ¿Rechazo valores negativos o mayores de 100 con `University.ScoreOutOfRange`, o acepto cualquier número?
   - ¿Seguro que es una calificación de la universidad y no la relevancia de Elasticsearch? El endpoint se llama `ElasticSuggest` y en Elastic `score` suele ser la relevancia, que no tiene límite. Esto también afecta al rango.
5. **Nombre de la universidad:**
   - ¿Es obligatorio?
   - ¿Se recorta como `UserName`?
   - ¿Tiene longitud máxima?
   - Si `organizationName` llega vacío, ¿uso `matchedName` como alternativa o rechazo el registro?
6. **Foto del `Score` compartida:** como varios usuarios comparten la misma `University`, la "foto" del score es **de la universidad**, no del usuario. Si un segundo usuario se registra y Frontiers devuelve otro score o nombre, ¿se mantiene lo guardado la primera vez (propongo esto) o se actualiza? Afecta al get-or-create del handler y a si `University` necesita un método de actualización.
7. **¿La no elegibilidad es un éxito o un error?**
   - Opción A: `InviteReviewer` devuelve éxito con `IsEligible = false` y los motivos (200).
   - Opción B: devuelve un fallo (p. ej. 422).
   - Además, ¿qué `ErrorType` llevan los tres motivos? Propongo `Validation` si es la opción B. No encaja del todo porque el enum no tiene `BusinessRule`.
8. **Errores de `Create`:** ¿basta con devolver el primero (un `Error` por `Result`) o quieres que `Result` acumule varios errores de validación?
9. **Dónde van los errores de revisor:** el árbol no tiene `ReviewerErrors.cs`, así que propongo definirlos como estáticos en `ReviewerEligibility`. ¿Prefieres que añada `Reviewers/ReviewerErrors.cs` para que sea simétrico con `UserErrors` y `UniversityErrors`?
10. **Mensajes de error:** ¿algún formato concreto? Propongo frases cortas en inglés, p. ej. `"User name is required."`.
11. **Campos extra de `University`:** ¿alguno de `Country`, `CountryIsoCode` o `WebDomain` debería estar en el dominio para mostrarlo al usuario? Mi propuesta es que no.
12. **Commits:** tengo guardado "no hacer commits sin tu consentimiento". Entiendo que "un commit por unidad de trabajo" en este encargo es ese consentimiento para `feat/domain-model`. Sin push. ¿Correcto?

Paro aquí y espero tu respuesta antes de escribir código.

## Human

```text

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

```

_(3 tool calls: 2 Bash, 1 Write)_

## Assistant

He creado `odd/tasks/domain-model.md` con 6 tareas en la rama `feat/domain-model`, creada desde `main`. Delego la implementación a un único agente de escritura.

_(1 tool calls: 1 Agent)_
- `Agent` — Implement domain-model T1-T6

## Assistant

La implementación de T1 a T6 está en marcha. Cuando termine, compruebo el resultado, vuelvo a ejecutar yo mismo parte de la verificación y te enseño las salidas.

_[Background agent finished and reported back]_

## Assistant

Resultado provisional: el agente va por T3 y está ejecutando la verificación. Espero a que termine.

_[Background agent finished and reported back]_

## Assistant

El agente sigue trabajando y va por T4. Espero a que termine.

_[Background agent finished and reported back]_

## Assistant

El agente sigue trabajando y va por T5. Espero a que termine.

_[Background agent finished and reported back]_

## Assistant

El agente sigue trabajando y va por T6. Espero a que termine.

_[Background agent finished and reported back]_

## Assistant

Está terminando la verificación final. Espero el informe.

_[Stop hook: RDD asked to run the review preflight for the new commit]_

_(1 tool calls: 1 Bash)_

## Assistant

Los seis commits están hechos y el árbol de trabajo está limpio. Ejecuto la comprobación previa de la revisión:


_[Gentle AI review consent: Review this change]_

## Human

_(sent while the assistant was working)_

_[Background agent finished and reported back]_

## Assistant

Has elegido «Review this change». Ejecuto la invocación exacta:

_(1 tool calls: 1 Bash)_

## Assistant

Todo sale en verde. Reviso a mano los ficheros clave del dominio:

_(2 tool calls: 2 Bash)_

_[Gentle AI review consent: Reportar y continuar]_

## Assistant

Has elegido reportar. Preparo el diagnóstico anonimizado y busco antes si ya existe una issue equivalente:

_(2 tool calls: 2 Bash)_

## Assistant

Comentario publicado. Para continuar, ejecuto la invocación de rechazo capturada (una sola vez) y vuelvo a consultar el estado:


## Assistant

Rechazo validado: `action: declined`, `consent: declined_this_candidate` y el mismo `target_identity`. En el documento de la feature falta el hash de T6 y el resultado de la revisión. Lo completo:

_(2 tool calls: 2 Bash)_

## Assistant

# Paso del modelo de dominio: implementado en `feat/domain-model`

Las seis tareas están hechas, con un commit por tarea más uno de documentación. La rama sale de `main` (179e2f2) y no he hecho push. Las verificaciones pasan todas (las volví a ejecutar yo). La revisión automática de Gentle AI no se pudo hacer (detalles abajo).

## Commits y RED observado (TDD)

| Tarea | Commit | RED | GREEN |
|---|---|---|---|
| T1 SharedKernel | `e333035` | 18 fallidos / 0 correctos (`NotImplementedException`) | 18/18 |
| T2 University | `3c77609` | 15 / 0 | 33/33 |
| T3 User | `7ba19a5` | 15 / 0 | 48/48 |
| T4 Elegibilidad de revisores | `f3cf66a` | 9 / 0 | 57/57 |
| T5 Puertos de persistencia | `f1017ad` | Sin RED: solo interfaces, se comprueba compilando | Build limpio |
| T6 EF Core InMemory y tests de integración | `667f5ae` | 4 / 1 | 62/62 |
| Documento de la feature | `3b89aa1` | — | — |

- **RED de T6:**
  - Los repositorios fallaban con `NotImplementedException`.
  - El test de inyección de dependencias fallaba con `No service for type 'IUserRepository'`.
  - "Dos usuarios comparten la misma `University`" ya pasaba en el RED, porque no usa los métodos pendientes.
- **Evidencia completa:** está en `odd/tasks/domain-model.md`.

## Verificación (desde `apps/api`)

```
dotnet format whitespace ... --verify-no-changes   → exit 0
dotnet format style ... --verify-no-changes        → exit 0
dotnet build PeerReview.slnx -c Release            → 0 Advertencia(s), 0 Errores
dotnet test PeerReview.slnx -c Release
  Correctas! Superado: 57, Total: 57 - PeerReview.Domain.UnitTests
  Correctas! Superado:  5, Total:  5 - PeerReview.Infrastructure.IntegrationTests
dotnet list src/PeerReview.Domain reference          → (ninguna)
dotnet list src/PeerReview.Application reference     → PeerReview.Domain
dotnet list src/PeerReview.Infrastructure reference  → PeerReview.Application
dotnet list src/PeerReview.Api reference             → Application + Infrastructure
dotnet list src/PeerReview.Domain package            → No se encontró ningún paquete
dotnet list src/PeerReview.Application package       → solo Microsoft.Extensions.DependencyInjection.Abstractions 10.0.12
dotnet list tests/PeerReview.Infrastructure.IntegrationTests reference → solo PeerReview.Infrastructure
grep -rE "using PeerReview\.(Infrastructure|Api)|Microsoft\.EntityFrameworkCore" ... --include=*.cs → vacío (exit 1)
```

El `grep` lo filtré a `*.cs` para no recorrer `bin/obj`.

## Desviaciones menores respecto a lo propuesto

- **`University` no tiene constructor sin parámetros:** EF la construye con el constructor privado que recibe sus valores; lo confirman los tests de integración. `User` sí lo tiene, comentado, porque EF no puede pasar la navegación `University` por constructor.
- **Repositorios `public`:** así los tests de integración los crean directamente sin necesitar `InternalsVisibleTo`.
- **Versiones y aislamiento:** `Microsoft.EntityFrameworkCore.InMemory` va en `10.0.12`, en `Directory.Packages.props`. Cada test de integración usa su propia base de datos y lee los datos con un `DbContext` nuevo.

## Revisión automática de Gentle AI: no se pudo completar

- Aceptaste la revisión.
- La primera consulta de estado falló por `operation_timeout`, con `retry_safe: false`.
- Con tu consentimiento añadí una ocurrencia a la issue existente equivalente: [gentle-ai#4655](https://github.com/Gentleman-Programming/gentle-ai/issues/4655#issuecomment-5835330167). No tiene corrección publicada: también se reproduce en 3.7.0, la última versión, y tú tienes la 3.6.1.
- Después omití la revisión de este cambio con la invocación de rechazo capturada, y el resultado se validó.
- **Este cambio no tiene revisión aprobada.**

## Punto pendiente que decides tú

`UniversityConfiguration` declara `Score` con `HasPrecision(5, 2)`. Eso limita el valor a 999.99 con dos decimales, lo que contradice la decisión de "sin límite superior". InMemory lo ignora, pero con una base de datos relacional el valor se limitaría. Te propongo quitarlo. No lo he cambiado.

## Decisiones para el README

1. **Identificadores `Guid` v7 generados por el dominio:** nos desviamos a propósito de `InviteReviewer(int UserId)`. Los ids no son enumerables, no revelan cuántos usuarios hay, se conocen antes de persistir y no dependen del proveedor de datos.
2. **`FrontiersOrganizationId` (`long`, `> 0`):** es una clave de negocio, no la identidad de la universidad. Los usuarios de la misma universidad comparten una sola `University`.
3. **`Score` (`decimal?`):**
   - Nulo significa desconocido.
   - Un valor negativo no es válido y no hay límite superior.
   - Probablemente es la relevancia de Elasticsearch, pero se aplica el enunciado tal cual (`>= 60`).
4. **Foto del score:** se guarda al registrar la universidad por primera vez y no se actualiza después.
5. **Resultado de la elegibilidad:** no ser elegible es un resultado correcto (`IsEligible = false` más todos los motivos `IneligibilityReason`), no un error. Las factorías juntan todos los errores de validación en un `ValidationError`.
6. **Índice único en InMemory:** el índice sobre `FrontiersOrganizationId` está declarado, pero InMemory no lo aplica. La garantía de no duplicar llegará con el get-or-create del handler.

**Siguiente paso:** el push y la PR los decides tú (son unas 1435 líneas, así que conviene hablar de dividirla en varias PR). Luego viene el caso de uso `RegisterUser`.

## Human

Ya la he subido y como la mayoria del codigo es Boilerplate, no hay problema. Exporta la conversacion para cumplir con el requisito de la empres

_(2 tool calls: 2 Bash)_
