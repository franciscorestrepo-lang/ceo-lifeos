# CEO LifeOS — seguimiento operativo

Visor estático del corte de revisión y acceso al detalle privado del CEO Command Center.

## Alcance de esta versión
- Corte W45 y preparación W46, 8 de noviembre de 2026. Cobertura parcial.
- Resumen por AllUp, Teky y Sports Crowd; el contenido de proyectos, responsables, agenda y fuentes permanece en el informe privado de OneDrive.
- El enlace requiere los permisos corporativos existentes y no cambia quién puede acceder al archivo.
- No incluye módulo financiero ni movimientos, saldos, tarifas o remuneración.
- Los archivos históricos publicados se redujeron a metadatos de periodo; los originales y evidencias no se vuelven a publicar aquí.

## Funcionamiento
El botón Actualizar recarga los archivos del sitio. No inicia agentes ni escribe correos, calendarios o documentos. No se afirma que exista una automatización programada.

Los datos se sirven desde el propio sitio. No hay integración directa con las fuentes, credenciales ni funciones de análisis en la web. El detalle se consulta en OneDrive.

## Build y comprobaciones
npm test
npm run build

El build valida el contrato y las exclusiones de contenido y genera build-info.json con COMMIT_REF y DEPLOY_ID cuando Netlify los proporciona. No se inventa el SHA de publicación dentro de status.json.

Los documentos de /data/ se consultan sin caché. El Service Worker usa una versión nueva y elimina las cachés anteriores al activarse.

## Límite de la limpieza
Esta actualización limpia el árbol actual y el nuevo despliegue. No reescribe el historial Git ni elimina versiones anteriores del hosting. El acceso a copias históricas debe tratarse por separado.
