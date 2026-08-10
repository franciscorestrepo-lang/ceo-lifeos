# CEO LifeOS — Netlify flat project

Proyecto 100% plano: no contiene subcarpetas.

## Qué cambió

- Monday queda fuera del flujo de ejecución.
- Francisco ejecuta únicamente acciones propias mediante calendario.
- La delegación se canaliza mediante borradores de correo.
- Panel de aprobación interactivo con selección individual o por lote.
- Calendario: genera archivos `.ics` importables en Outlook, Google Calendar, Apple Calendar, etc.
- Correo: abre borradores con `mailto:` en el cliente configurado.
- Integración opcional: puede enviar aprobaciones a un webhook de n8n, Make o una API propia.
- Modo foco para ocultar ruido y ver solo resultados, calendario, correos y aprobación.
- PWA instalable en móvil.

## Despliegue en Netlify

1. Descomprime el ZIP.
2. Crea un repositorio GitHub vacío.
3. Sube TODOS los archivos directamente a la raíz del repositorio.
4. En Netlify: **Add new site → Import an existing project → GitHub**.
5. Selecciona el repositorio.
6. Build command: `npm run build` (opcional; el sitio es estático).
7. Publish directory: `.`
8. Deploy.

No necesitas variables de entorno para el modo local.

## Actualizar cada semana

La información visible vive en `data.js`.

Reemplaza el objeto `window.LIFEOS_DATA` por el JSON/JS generado en la revisión semanal y haz commit. Netlify desplegará automáticamente.

### Automatización recomendada

Usa n8n o Make para:

1. Recibir el resultado estructurado de la revisión semanal.
2. Generar/reemplazar `data.js` en GitHub usando la API de GitHub.
3. Netlify detecta el commit y publica el LifeOS actualizado.

Esta arquitectura mantiene el proyecto plano y evita funciones Netlify en subcarpetas.

## Panel de aprobación

### Modo local

- **Aprobar calendario:** descarga `.ics` por cada bloque seleccionado.
- **Aprobar correos:** para un solo correo abre el borrador. Si seleccionas varios, quedan aprobados y debes abrirlos uno a uno para evitar bloqueos del navegador.
- No envía correos automáticamente.
- No agrega asistentes automáticamente.

### Modo webhook

En **Configurar integración** puedes indicar una URL de webhook.

Al aprobar, el sitio hace POST con:

```json
{
  "type": "lifeos_approval",
  "approved_at": "ISO-8601",
  "calendar": [],
  "emails": []
}
```

En n8n/Make puedes conectar ese payload a Outlook/Gmail/Google Calendar/Microsoft Calendar para crear borradores y eventos reales.

## Seguridad

No almacenes credenciales de Microsoft, Google ni secretos de API en `data.js` o GitHub. Si usas webhook, protege la automatización del lado del servidor.
