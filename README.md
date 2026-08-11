# CEO LifeOS v5

PWA ejecutiva para Francisco. Netlify es únicamente la capa de visualización. GitHub es el datastore/histórico. ChatGPT es el motor de ingestión, análisis y ejecución porque allí ya están conectados Outlook, Calendar, Teams, Read AI y GitHub.

## Arquitectura

```text
Outlook + Flagged + Calendar + Teams + Read AI
                    ↓
             ChatGPT connectors
                    ↓
           Chief of Staff analysis
                    ↓
                GitHub main
   data/current.json + históricos + status
                    ↓
              Netlify static PWA
```

No hay MSAL, Microsoft Graph, Read AI API, OpenAI API ni secretos de fuentes en la PWA o en Netlify.

## Actualización automática

La automatización de ChatGPT `CEO LifeOS Weekly Sync` se ejecuta cada lunes a las 8:00 a. m. America/Bogota. Revisa 30 días de Outlook/Teams/Read AI, calendario -30/+30, correos con bandera, genera la revisión ejecutiva y actualiza:

- `data/current.json`
- `data/status.json`
- `data/weekly/YYYY-Www.json`
- `data/monthly/YYYY-MM.json`
- `data/annual/YYYY.json`

Cada commit en `main` provoca el deploy automático de Netlify.

## Actualización a demanda

El botón **Actualizar con ChatGPT**:

1. copia el comando maestro de revisión;
2. abre ChatGPT;
3. Francisco pega/envía el comando en su CEO Command Center;
4. ChatGPT usa los conectores ya autorizados y actualiza GitHub;
5. LifeOS consulta `raw.githubusercontent.com` cada 15 segundos y detecta el nuevo `generated_at`;
6. al volver a la PWA el tablero se refresca automáticamente.

La limitación deliberada es que una web externa no puede disparar silenciosamente un agente interno de ChatGPT sin un webhook/API. Por seguridad y para evitar duplicar credenciales, el envío del comando requiere una interacción en ChatGPT.

## Aprobaciones

La PWA no escribe directamente en Outlook. En Foco y Delegar se seleccionan propuestas y se pulsa **Aprobar seleccionados**. LifeOS copia un comando de aprobación y abre ChatGPT:

- calendario: ChatGPT verifica disponibilidad y crea solo los eventos aprobados;
- correo: ChatGPT crea borradores en Outlook; nunca envía por defecto.

## Fuente de datos

La PWA intenta primero:

`https://raw.githubusercontent.com/franciscorestrepo-lang/ceo-lifeos/main/data/current.json`

con fallback al archivo incluido en el deploy de Netlify. Así puede ver una actualización de GitHub incluso antes de que termine un nuevo deploy.

## Pruebas automáticas

`npm run build` ejecuta `scripts/validate.mjs` y bloquea el deploy si:

- `current.json` queda vacío en resultados, decisiones o acciones;
- `status.json` no contiene estado/fecha/periodo;
- reaparece una integración directa a Microsoft, Read AI u OpenAI;
- el botón no contiene el comando de ChatGPT;
- desaparecen las acciones de aprobación;
- Netlify vuelve a tener Functions/API;
- el Service Worker no invalida versiones anteriores.

## Despliegue

Netlify está conectado a `franciscorestrepo-lang/ceo-lifeos`, rama `main`.

Build:

```bash
npm run build
```

Publish directory: `.`

No se requieren variables de entorno para operar LifeOS v5.

## Principios

- Máximo 5 resultados críticos semanales.
- Máximo 5 decisiones.
- Máximo 7 acciones personales.
- 30% de buffer ejecutivo.
- AllUp, Teky y Sports Crowd siempre separados.
- Trabajo CEO -> decisión/calendario.
- Trabajo operativo -> delegación/correo.
- GitHub conserva el histórico; la PWA nunca inventa datos.
