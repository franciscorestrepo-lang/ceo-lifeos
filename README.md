# CEO LifeOS — Netlify

Dashboard semanal multicompañía para AllUp, Teky, Sports Crowd y Personal.

## Qué incluye

- Dashboard responsive y PWA instalable.
- Resumen, compañías, decisiones, riesgos, calendario y panel de aprobación.
- Datos persistentes mediante Netlify Blobs.
- Página `/admin.html` para actualizar el JSON sin redeploy.
- Función programada semanal para actualización automática desde una fuente externa.

## Despliegue rápido en Netlify

1. Descomprime el proyecto.
2. Crea un repositorio nuevo en GitHub y sube todos los archivos.
3. En Netlify: **Add new site → Import an existing project → GitHub**.
4. Selecciona el repositorio.
5. Configuración:
   - Build command: `npm run build`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
6. Pulsa **Deploy site**.
7. En **Site configuration → Environment variables**, crea:
   - `LIFEOS_ADMIN_TOKEN`: una clave larga y privada.
8. Abre `https://TU-SITIO.netlify.app/admin.html`, pega el token y el JSON semanal.

## Actualización semanal automática

La función `weekly-refresh` se ejecuta cada lunes a las 8:00 a. m. de Colombia (13:00 UTC).

Para activar el modo automático configura:

- `LIFEOS_SOURCE_URL`: URL HTTPS que devuelve el JSON semanal.
- `LIFEOS_SOURCE_TOKEN` (opcional): bearer token de esa fuente.

La fuente puede ser un webhook de Make, n8n, Zapier o una API propia. El flujo recomendado es:

1. El proceso semanal consulta correo, calendario, Teams, Read AI y Monday.
2. Genera un JSON con el mismo esquema de `data/current.json`.
3. Expone ese JSON en una URL protegida o lo envía directamente a:
   `POST /.netlify/functions/update-dashboard`
4. Incluye el header `x-admin-token` con `LIFEOS_ADMIN_TOKEN`.

## Realidad de la automatización

Netlify no puede acceder directamente a las conexiones privadas de ChatGPT. Por eso hay dos niveles:

- **Disponible de inmediato:** la revisión semanal de ChatGPT se ejecuta cada lunes y el JSON se pega en `/admin.html`; el dashboard se actualiza sin redeploy.
- **100 % automático:** Make/n8n debe conectarse a Microsoft 365, Teams, Monday y Read AI, producir el JSON y llamar el endpoint de actualización.

## Probar localmente

```bash
npm install
npx netlify dev
```

Luego abre `http://localhost:8888`.

## Seguridad

- No publiques el token de administración en GitHub.
- Usa variables de entorno de Netlify.
- El dashboard no incluye datos sensibles por defecto; limita nombres, cifras y URLs según necesidad.
