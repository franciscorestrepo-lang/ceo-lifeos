# CEO LifeOS

PWA ejecutiva para Francisco: objetivos anuales/mensuales/semanales, foco, decisiones, delegación, riesgos y capacidad ejecutiva.

## Qué hace

- Lee Outlook Inbox/Sent de los últimos 30 días y consulta correos con bandera por separado.
- Lee Calendar de -30/+30 días y detecta carga/conflictos.
- Lee Teams según permisos disponibles.
- Lee Read AI mediante Netlify Function.
- Analiza con OpenAI o Anthropic Claude.
- Mantiene `data/current.json` e histórico semanal/mensual/anual en GitHub.
- Crea bloques aprobados directamente en Outlook Calendar.
- Crea borradores o envía correos desde Outlook previa aprobación.
- No usa n8n, Make, Zapier ni Monday.

## Arquitectura

PWA (Netlify) → Microsoft Graph + Read AI → OpenAI/Claude → JSON estructurado → GitHub → Netlify redeploy.

El botón **Actualizar** usa OAuth/PKCE interactivo para Microsoft 365. El refresh programado de los lunes requiere credenciales de aplicación de Microsoft guardadas solo en Netlify.

## Variables Netlify

AI:

- `AI_PROVIDER=openai` o `anthropic`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

Read AI:

- `READ_AI_API_KEY`

GitHub:

- `GITHUB_TOKEN`
- `GITHUB_OWNER=franciscorestrepo-lang`
- `GITHUB_REPO=ceo-lifeos`
- `GITHUB_BRANCH=main`

Refresh semanal Microsoft (opcional):

- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_USER_ID`

## Microsoft Entra

Registrar una SPA con redirect `https://TU-SITIO.netlify.app` y permisos delegados:

`User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.Read`, `Calendars.ReadWrite`, `Chat.Read`, `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Read.All`.

En la app, doble clic en **Microsoft 365** para guardar Client ID y Tenant ID localmente.

## Deploy Netlify

Conecta este repo en Netlify. `netlify.toml` ya define build, publish, functions, redirects y cron de lunes 13:00 UTC (8:00 Colombia).

## Seguridad

OpenAI/Claude/Read/GitHub secrets viven solo en Netlify. Microsoft manual usa MSAL + PKCE. El secreto de Microsoft para refresh autónomo nunca llega al navegador.

## Operación

- Máximo 5 resultados críticos.
- Máximo 5 decisiones.
- Máximo 7 acciones personales.
- 30% de buffer ejecutivo.
- Trabajo propio → calendario.
- Trabajo operativo → delegación por correo.
- Flagged mail → CEO_DECISION / DELEGATE / WAITING / FOLLOW_UP / CLOSE_FLAG.

## Validación local

`npm install && npm run validate`

Para desarrollo con Functions: `npx netlify dev`.
