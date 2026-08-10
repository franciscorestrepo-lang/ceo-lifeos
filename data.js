window.LIFEOS_DATA = {
  meta:{week:"Semana del 10 al 16 de agosto de 2026",status:"Foco alto · ejecución controlada",loadScore:"68%",loadHint:"Dentro del límite si delegas seguimiento operativo"},
  outcomes:[
    {company:"AllUp",title:"Convertir oportunidades enterprise activas en siguiente paso fechado"},
    {company:"AllUp",title:"Cerrar plan de recuperación Riopaila sin ampliar alcance"},
    {company:"Sports Crowd",title:"Autorizar lanzamiento solo con pagos y estabilidad en verde"},
    {company:"Teky",title:"Separar roadmap de producto de la operación de clientes"},
    {company:"CEO",title:"Reducir WIP personal a decisiones, relaciones y desbloqueos"}
  ],
  companies:[
    {name:"AllUp",role:"CEO/CCO",state:"Atención",metrics:[['Caja','Prioridad 1'],['Ventas','Activas'],['Delivery','Riesgo Riopaila']],focus:"Cerrar, cobrar y proteger margen."},
    {name:"Teky",role:"CPO/CTO",state:"Reordenar",metrics:[['Roadmap','Sin owner único'],['Fixi','Validación comercial'],['QA','Automatización en curso']],focus:"Producto repetible, no fábrica artesanal."},
    {name:"Sports Crowd",role:"COO/CTO",state:"P0 operativo",metrics:[['Pagos','Readiness pendiente'],['Estabilidad','Incidentes abiertos'],['Clubes','Lanzamientos próximos']],focus:"Estabilidad antes de acelerar revenue."},
    {name:"Personal",role:"CEO Command Center",state:"Controlado",metrics:[['Carga','68%'],['Deep work','Protegido'],['Decisiones','3 críticas']],focus:"No absorber operación del equipo."}
  ],
  decisions:[
    {id:"DEC-01",company:"Sports Crowd",priority:"P0",title:"Go / No-Go de lanzamiento",deadline:"Martes 12:00",recommendation:"Piloto controlado únicamente con pagos, SMTP, PWA y estabilidad en verde."},
    {id:"DEC-02",company:"AllUp",priority:"P0",title:"Plan de recuperación Riopaila",deadline:"Miércoles",recommendation:"Congelar alcance, separar incidentes de nuevos requerimientos y fijar fecha final."},
    {id:"DEC-03",company:"Teky",priority:"P1",title:"Owner y sistema operativo de producto",deadline:"Viernes",recommendation:"Un owner, un roadmap y capacidad explícita para Fixi, Flow y QA."}
  ],
  risks:[
    {id:"R-01",company:"Sports Crowd",priority:"P0",title:"Lanzar con fallas de pagos o estabilidad",mitigation:"Checklist técnico y piloto limitado."},
    {id:"R-02",company:"AllUp",priority:"P0",title:"Deterioro de Riopaila",mitigation:"War room de cierre y narrativa con evidencia."},
    {id:"R-03",company:"CEO",priority:"P1",title:"Context switching excesivo",mitigation:"Máximo 7 acciones propias y delegación por correo."},
    {id:"R-04",company:"Teky",priority:"P1",title:"Desarrollo sin producto consolidado",mitigation:"Roadmap único y métricas de adopción/venta."}
  ],
  calendar:[
    {id:"CAL-01",company:"Sports Crowd",priority:"P0",title:"Go/No-Go lanzamiento y pagos",date:"2026-08-10",start:"12:30",end:"13:15",minutes:45,objective:"Tomar una decisión de lanzamiento con condiciones explícitas.",checklist:["Estado PWA","Tienda B","Recurrencia","SMTP","Prueba end-to-end","Rollback y soporte"]},
    {id:"CAL-02",company:"AllUp",priority:"P0",title:"Comité de recuperación Riopaila",date:"2026-08-11",start:"08:30",end:"09:15",minutes:45,objective:"Aprobar alcance congelado, compromisos y fecha de cierre.",checklist:["Alcance inicial vs entregado","Incidentes abiertos","Dependencias SAP/Fiori","Disponibilidad usuarios","Plan final"]},
    {id:"CAL-03",company:"AllUp",priority:"P1",title:"Aprobación comercial Surtigas/GDO",date:"2026-08-12",start:"08:30",end:"09:15",minutes:45,objective:"Aprobar alcance, margen, pricing y exclusiones.",checklist:["CAPEX","Soporte","Infraestructura","Bolsa de horas","APIs","Margen"]},
    {id:"CAL-04",company:"AllUp",priority:"P1",title:"Decisión propuesta Popsy",date:"2026-08-13",start:"12:30",end:"13:15",minutes:45,objective:"Escoger alternativa comercial y siguiente paso con compras.",checklist:["Fixi + SAP","Fixi standalone","Usuarios","Infraestructura","Compras/MM"]},
    {id:"CAL-05",company:"Teky",priority:"P1",title:"Roadmap y sistema operativo de producto",date:"2026-08-14",start:"08:30",end:"09:30",minutes:60,objective:"Nombrar owner y aprobar roadmap trimestral.",checklist:["Fixi","Flow","QA","IA","Capacidad","Métricas"]},
    {id:"CAL-06",company:"CEO",priority:"P1",title:"Cierre semanal y limpieza de WIP",date:"2026-08-14",start:"16:00",end:"16:45",minutes:45,objective:"Cerrar pendientes, rechazar ruido y preparar próxima semana.",checklist:["Resultados","Decisiones","Delegaciones","Riesgos","Capacidad"]}
  ],
  emails:[
    {id:"MAIL-01",company:"AllUp",priority:"P0",to:"carolina.castillo@allup.com.co",cc:"nathalia.tobar@allup.com.co",subject:"Foco comercial de la semana | Surtigas, Popsy, TDM y Alquería",objective:"Delegar seguimiento comercial con fecha y próximo paso.",body:"Hola Caro, buen día.\n\nQuiero que esta semana concentremos el seguimiento comercial en Surtigas/GDO, Popsy, TDM y Alquería.\n\nPor favor deja cada oportunidad con: próximo paso, responsable, fecha, monto/alcance actualizado y principal bloqueo. Mi participación debe quedar limitada a decisiones de pricing, negociación o reunión ejecutiva con el cliente.\n\nPrioridad: evitar que las conversaciones vuelvan a enfriarse y cerrar una acción concreta por oportunidad antes del viernes.\n\nEnvíame un único resumen ejecutivo con las cuatro oportunidades y cualquier decisión que requieras de mi parte.\n\nGracias,\nFrancisco"},
    {id:"MAIL-02",company:"AllUp",priority:"P0",to:"daniel.daza@allup.com.co",cc:"mario.zuluaga@allup.com.co",subject:"Riopaila | Plan definitivo de cierre",objective:"Delegar cierre del informe y plan verificable.",body:"Hola Daniel, Mario.\n\nNecesito que dejemos listo el plan definitivo de cierre de Riopaila, con evidencia verificable y sin abrir nuevos frentes.\n\nEl entregable debe incluir: alcance inicial vs entregado, funcionalidades adicionales, incidentes todavía abiertos, dependencias SAP/Fiori, indisponibilidades que podamos sustentar, responsables y cronograma final.\n\nNo incluyamos cifras que no podamos respaldar. Lo que no sea verificable debe quedar señalado como supuesto o estimación.\n\nCompártanme una versión final para aprobación ejecutiva antes del comité.\n\nGracias,\nFrancisco"},
    {id:"MAIL-03",company:"Sports Crowd",priority:"P0",to:"mauricio.sanchez@fanaticadas.co",cc:"",subject:"Readiness de lanzamiento | Evidencia para Go/No-Go",objective:"Delegar paquete de readiness antes de la decisión de lanzamiento.",body:"Hola Mau, buen día.\n\nAntes de autorizar el próximo lanzamiento necesito un paquete de readiness simple y verificable.\n\nPor favor consolida en un solo documento el estado de: PWA, Tienda B, recurrencia, SMTP, pagos end-to-end, conciliación, monitoreo, rollback y soporte durante la salida.\n\nCada punto debe quedar en verde, amarillo o rojo, con evidencia y responsable. No necesitamos más status; necesitamos saber qué impide salir y qué riesgo aceptamos si avanzamos.\n\nCon eso tomo la decisión de Go/No-Go.\n\nGracias,\nFrancisco"},
    {id:"MAIL-04",company:"Teky",priority:"P1",to:"daniel.daza@allup.com.co",cc:"",subject:"Teky | Propuesta de roadmap y automatización de QA",objective:"Delegar preparación de insumos, no la decisión de producto.",body:"Hola Daniel.\n\nPara la revisión de Teky necesito que prepares un insumo concreto en dos partes:\n\n1. Estado actual de Fixi, Flow y automatización de QA: qué está terminado, qué está en curso, qué bloquea y qué tiene uso o cliente asociado.\n2. Propuesta de próximos 30 días priorizada por impacto en producto, calidad y reutilización.\n\nNo incluyas trabajo que no tenga resultado observable. Si una iniciativa no tiene cliente, validación o métrica, déjala marcada como apuesta y con un límite claro de esfuerzo.\n\nYo tomaré la decisión final de prioridades y owner.\n\nGracias,\nFrancisco"}
  ]
};
