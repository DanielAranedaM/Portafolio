# ElDato - Service Marketplace Platform

## Project Overview
Angular 19+ standalone component application connecting service providers with clients. Backend API at `https://localhost:7054` (configurable in `app.config.ts`). Uses JWT authentication with Bearer tokens stored in `localStorage`.

## Architecture & Key Patterns

### API Communication
- **Base URL Injection**: All services use `@Inject(API_URL)` token pattern (see `core/tokens/api-url.token.ts`)
- **Auth Flow**: `authInterceptor` automatically appends `Authorization: Bearer ${token}` header from `localStorage.getItem('auth_token')`
- **Error Handling**: Services extract `err.error.message` (400) or `err.error.title` (500) from HttpErrorResponse
- **FormData Pattern**: File uploads use `FormData` with `imagenes` field for multiple files (see `services.service.ts`)

### Service Layer Structure
Located in `core/services/`:
- `access.service.ts` - Login/Register (no idUsuario in register payload)
- `users.service.ts` - User profile, photo management (uses FormData)
- `services.service.ts` - Service CRUD (backend extracts userId from JWT, never send in body)
- `solicitudes.service.ts` - Request management
- `calificaciones.service.ts` - Rating system
- `categorias.service.ts` - Service categories

**Critical**: Backend extracts user identity from JWT. Never include `IdUsuario` in POST/PUT bodies.

### Data Models (DTOs)
All in `core/models/`. Key patterns:
- Separate DTOs for create vs. read operations (`create-service.dto.ts` vs `servicio.dto.ts`)
- `UsuarioDetalleDTO` includes nested `DireccionDTO` and role flags (`esProveedor`, `esCliente`)
- Dates are ISO strings, convert with `new Date()`

### Routing & Navigation
- Flat route structure in `app.routes.ts` (no lazy loading currently)
- Default redirect: `'' → 'home'`
- Wildcard route: `'**' → LoginComponent`
- Role-based UI: Check `userRole === 'proveedor'` vs `'cliente'` in components

### State Management
- **No global state library**: Local component state with RxJS
- **Session Data**: `localStorage['auth_token']`, optional `localStorage['userData']`
- **User Info**: Always call `usersService.getMe()` for fresh data, don't rely on localStorage
- **Provider Dashboard**: `servicesService.getDashboardDataForProveedor()` returns array with service stats

## Common Workflows

### Development Commands
```bash
npm start           # Dev server on localhost:4200
npm test            # Karma/Jasmine unit tests
npm run build       # Production build to dist/
npm run watch       # Continuous development build
```

### Creating New Services
1. Add DTO interfaces in `core/models/` (create + response types)
2. Create service in `core/services/` with `@Inject(API_URL)` constructor
3. Use `private handleError` method for consistent error handling
4. Return typed Observables: `Observable<YourDTO>`

### File Upload Pattern

**Frontend (Angular)**:
```typescript
const formData = new FormData();
formData.append('Titulo', 'Example');
formData.append('IdCategoriaServicio', '1');
// Add multiple files with the same field name
this.selectedFiles.forEach(file => {
  formData.append('imagenes', file, file.name);
});
return this.http.post<ServicioDTO>(`${this.base}/CreateService`, formData);
```

**Backend (ASP.NET Core)**:
```csharp
// Controller receives List<IFormFile>
[HttpPost("CreateService")]
public async Task<IActionResult> CreateService(
    [FromForm] string Titulo,
    [FromForm] int IdCategoriaServicio,
    [FromForm] List<IFormFile>? imagenes)
{
    // 1. Upload images first
    List<FotoServicioDTO>? fotos = null;
    if (imagenes != null && imagenes.Count > 0)
    {
        fotos = await _servicesService.UploadImages(imagenes);
    }
    
    // 2. Create service with photo URLs
    var createDTO = new CreateServiceDTO
    {
        Titulo = Titulo,
        IdCategoriaServicio = IdCategoriaServicio,
        Fotos = fotos
    };
    
    var result = await _servicesService.CreateService(userId, createDTO);
    return CreatedAtAction(nameof(GetServiceById), new { id = result.IdServicio }, result);
}
```

**Backend Image Upload Implementation**:
`ServicesService.UploadImages()` performs:
1. Validates file types (JPEG, PNG, GIF, WEBP only)
2. Validates file size (max 5MB per image)
3. Generates unique GUID-based filenames to avoid collisions
4. Saves files physically to `wwwroot/uploads/`
5. Constructs absolute URLs using `IHttpContextAccessor` (e.g., `https://localhost:7054/uploads/abc123.jpg`)
6. Returns `List<FotoServicioDTO>` with first image marked as principal (`EsPrincipal = true`)

### Address/Geolocation Integration
- OpenStreetMap Nominatim API for address autocomplete (see `registrar-servicio.component.ts`)
- Use `countrycodes=cl` parameter for Chile-specific results
- Store lat/lon as strings, convert to decimal with Spanish locale: `toLocaleString('es-CL', { useGrouping: false })`

### Component Patterns
- **Standalone Components**: All components use `standalone: true`, explicit imports array
- **ViewChild**: Use `@ViewChild('elementRef')` for DOM manipulation (camera modal, scroll containers)
- **Signals**: Newer components use Angular signals (e.g., `chatbot.component.ts`: `isOpen = signal(false)`)
- **RxJS Patterns**: `forkJoin` for parallel requests, `debounceTime` + `switchMap` for search

### Image URLs
Backend returns **absolute URLs** like `https://localhost:7054/uploads/foto.jpg` via `IHttpContextAccessor`. The `UploadImages` method automatically constructs these URLs:
```csharp
var request = _httpContextAccessor.HttpContext?.Request;
var baseUrl = request != null
   ? $"{request.Scheme}://{request.Host}"
   : "https://localhost:7054"; // fallback for testing
var urlCompleta = $"{baseUrl}/uploads/{nombreArchivo}";
```

Frontend normalizes URLs defensively (handles both absolute and relative paths):
```typescript
private makeAbsoluteUrl(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta; // Already absolute
  return `${this.apiUrl}${ruta}`; // Fallback for relative paths
}
```

The `normalizeServicio()` method applies this to all `ServicioDTO.urlFotoPrincipal` values before returning to components.

## UI/UX Conventions

### Styling
- Bootstrap 5.3.8 (configured in `angular.json`, loaded globally)
- Bootstrap Icons 1.13.1
- Component-scoped CSS per Angular convention
- Provider dashboard has separate stylesheet: `proveedor-dashboard.css`

### User Roles
Two roles: `'proveedor'` (service provider) and `'cliente'` (client)
- Determine from `UsuarioDetalleDTO.esProveedor` / `esCliente`
- Show/hide features with `*ngIf="isProveedor"` computed properties

### Chatbot Integration
- `chatbot.component.ts` uses signals for reactive state
- Keyword-based response system in `botResponses` map
- Emits events to parent: `@Output() loginRequested`, `@Output() registerRequested`

## Testing & Quality

### TypeScript Configuration
- Strict mode enabled (`strict: true` in `tsconfig.json`)
- `noImplicitReturns`, `noFallthroughCasesInSwitch` enforced
- Use `experimentalDecorators: true` for Angular decorators

### Testing Setup
- Karma + Jasmine configured
- Spec files co-located with components (`.spec.ts`)
- Chrome launcher for browser tests

## Security & Authentication

### Auth Token Storage
- Token stored as `localStorage['auth_token']`
- Interceptor adds to all HTTP requests automatically
- Clear on logout: `localStorage.removeItem('auth_token')`, `sessionStorage.clear()`

### API Security
- Backend validates JWT on protected endpoints
- Frontend never sends user ID in request bodies (extracted from token)
- HTTPS required in production (localhost:7054 for dev)

## Known Patterns & Quirks

1. **FormData Decimal Format**: Use Spanish locale for lat/lon: `latitud.toLocaleString('es-CL', { useGrouping: false })` to match backend expectations
2. **Categorías Count**: Menu component loads service counts via parallel `forkJoin` requests, stores in `Map<number, number>`
3. **Camera Access**: Menu component implements full camera modal with stream management and canvas capture
4. **Search Results**: Menu uses unified `results[]` array with `resultMode: 'search' | 'category'` to distinguish data source
5. **ValidationProblemDetails**: Backend returns `{ errors: { field: string[] } }` for 400 validation errors - extract and format appropriately
6. **Image Upload Validation**: Backend validates file types and sizes in `UploadImages` method. Frontend should pre-validate for better UX but backend is the source of truth
7. **WebRootPath Fallback**: If `IWebHostEnvironment.WebRootPath` is null (rare), falls back to `Directory.GetCurrentDirectory()/wwwroot`

## Key Files Reference
- `app.config.ts` - DI configuration, API URL token provider, interceptor registration
- `app.routes.ts` - Route definitions
- `core/interceptors/auth.interceptor.ts` - JWT token injection
- `pages/menu/menu.component.ts` - Main dashboard, most complex component (500+ lines)
- `pages/registrar-servicio/registrar-servicio.component.ts` - Multi-step form, file upload, geocoding example
- `ElDatoAPI/Services/ServicesService.cs` - Backend service with `UploadImages` implementation
- `ElDatoAPI/Controllers/ServicesController.cs` - API endpoints for service management

## Backend Architecture Notes

### Image Upload Flow
1. Frontend sends `FormData` with multiple files under `imagenes` field
2. Controller receives as `List<IFormFile>? imagenes`
3. `ServicesService.UploadImages()` is called first (before DB insert)
4. Method returns `List<FotoServicioDTO>` with absolute URLs
5. `CreateService()` method receives these DTOs and inserts into DB
6. First image in array is automatically marked as principal photo

### Database Constraints
- `FotoServicio` table has unique index on `IdServicio` where `EsPrincipal = true`
- Only one principal photo per service is enforced at DB level
- `Servicio.IdUsuario` is extracted from JWT, never sent by frontend

