# CEO LifeOS v4

## Decisión de producto

`ceo-lifeos` es el sistema operativo ejecutivo. `life-os-guardian` permanece separado como PWA personal de rituales y bienestar.

## Flujo objetivo

1. Actualización manual o programada.
2. Lectura de Outlook, correos con bandera, calendario, Teams y Read AI.
3. Normalización y deduplicación.
4. Análisis Chief of Staff separado por AllUp, Teky, Sports Crowd y Personal.
5. Persistencia de estado actual e histórico anual/mensual/semanal.
6. LifeOS propone; Francisco aprueba; Outlook ejecuta calendario y borradores.

## Límites ejecutivos

- Máximo 5 resultados críticos semanales.
- Máximo 5 decisiones abiertas.
- Máximo 7 acciones personales activas.
- Mantener 30% de capacidad libre.
- Delegación operativa por correo; trabajo propio de alto impacto por calendario.

## Estado de migración

La rama `lifeos-v4` se usa para migrar sin afectar producción. Los archivos legacy `data.js`, `admin.html` y las functions anteriores se conservan hasta validar el nuevo deploy.

## Datos

- `data/current.json`: estado vigente.
- `data/annual/YYYY.json`: objetivos anuales.
- `data/monthly/YYYY-MM.json`: objetivos y seguimiento mensual.
- `data/weekly/YYYY-Www.json`: resultados, decisiones y acciones semanales.
- `data/snapshots/`: snapshots de refresh para evolución histórica.

## Seguridad

No almacenar tokens, client secrets ni API keys en el repositorio o en el navegador. Las credenciales backend deben vivir como variables privadas de Netlify. La ejecución de correo debe crear borradores por defecto; enviar requiere aprobación explícita posterior.
