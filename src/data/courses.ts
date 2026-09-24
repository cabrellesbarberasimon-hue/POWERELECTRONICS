import type { ContentType, Course, CourseStep, Localized, QuizQuestion } from '@/types/domain';

const L = (en: string, es: string): Localized => ({ en, es });

const step = (
  id: string,
  type: ContentType,
  title: Localized,
  body: Localized,
  opts: { min?: number; tags?: string[]; partId?: string; quiz?: QuizQuestion[] } = {},
): CourseStep => ({
  id,
  type,
  title,
  body,
  durationMin: opts.min ?? (type === 'video' ? 6 : type === 'test' ? 5 : 8),
  tags: opts.tags ?? [],
  partId: opts.partId,
  quiz: opts.quiz,
});

const q = (question: Localized, options: Localized[], answer: number): QuizQuestion => ({ question, options, answer });

export const courses: Course[] = [
  {
    id: 'c-hem',
    code: 'HEM',
    area: 'solar',
    level: 'basic',
    source: 'corporate',
    path: ['COURSES', 'SOLAR', 'HEM'],
    equipmentId: 'freesun-hemk',
    tags: ['solar', 'freesun', 'power-module', 'hardware'],
    title: L('Freesun HEM/HEMK Fundamentals', 'Fundamentos Freesun HEM/HEMK'),
    description: L(
      'Architecture, commissioning and first-level maintenance of the Freesun HEM central solar inverter.',
      'Arquitectura, puesta en marcha y mantenimiento de primer nivel del inversor solar central Freesun HEM.',
    ),
    sections: [
      {
        id: 's-hw',
        title: L('Electrical Hardware', 'Hardware eléctrico'),
        steps: [
          step('hem-hw-1', 'video', L('Cabinet overview', 'Visión general del armario'), L('A guided tour of the HEMK cabinet: DC input, power stacks, AC output and MV connection.', 'Recorrido guiado por el armario HEMK: entrada DC, módulos de potencia, salida AC y conexión a MT.'), { tags: ['hardware'] }),
          step('hem-hw-2', '3d', L('Power module anatomy', 'Anatomía del módulo de potencia'), L('Rotate the 3D model to identify the IGBT stack, heatsink, DC-link capacitors and quick connectors.', 'Rota el modelo 3D para identificar la pila de IGBT, el disipador, los condensadores del bus DC y los conectores rápidos.'), { tags: ['power-module', 'hardware'], partId: 'p-power-module' }),
          step('hem-hw-3', 'document', L('DC input fuses datasheet', 'Ficha de los fusibles DC'), L('Ratings, replacement criteria and torque values for the DC input fuses.', 'Valores nominales, criterios de sustitución y pares de apriete de los fusibles DC.'), { tags: ['dc', 'fuses'], partId: 'p-dc-fuses' }),
          step('hem-hw-4', 'test', L('Hardware check', 'Test de hardware'), L('Five questions about the cabinet hardware.', 'Cinco preguntas sobre el hardware del armario.'), {
            tags: ['hardware', 'power-module'],
            quiz: [
              q(L('Which component converts DC to AC?', '¿Qué componente convierte DC en AC?'), [L('Power module', 'Módulo de potencia'), L('Surge filter', 'Filtro de sobretensiones'), L('Cooling fan', 'Ventilador')], 0),
              q(L('What must you wait for before touching DC parts?', '¿Qué debes esperar antes de tocar partes DC?'), [L('Fan stop', 'Que paren los ventiladores'), L('Capacitor discharge (5 min)', 'Descarga de condensadores (5 min)'), L('HMI reboot', 'Reinicio del HMI')], 1),
              q(L('The HEMK enclosure protection rating is…', 'El grado de protección de la envolvente HEMK es…'), [L('IP20', 'IP20'), L('IP55', 'IP55'), L('IP68', 'IP68')], 1),
            ],
          }),
        ],
      },
      {
        id: 's-sw',
        title: L('Electrical Software', 'Software eléctrico'),
        steps: [
          step('hem-sw-1', 'text', L('Turn on the green button to activate the power modules.', 'Pulsa el botón verde para activar los módulos de potencia.'), L('From the HMI, check that there are no active alarms and press the green RUN button. Each power module reports "Ready" within 30 s.', 'Desde el HMI, comprueba que no hay alarmas activas y pulsa el botón verde RUN. Cada módulo informa "Ready" en 30 s.'), { tags: ['software', 'hmi', 'power-module'], partId: 'p-control' }),
          step('hem-sw-2', 'video', L('Grid code parameters', 'Parámetros de código de red'), L('How to review voltage and frequency ride-through settings.', 'Cómo revisar los ajustes de huecos de tensión y frecuencia.'), { tags: ['software', 'grid'] }),
          step('hem-sw-3', 'test', L('Software check', 'Test de software'), L('Three questions about the HMI.', 'Tres preguntas sobre el HMI.'), {
            tags: ['software', 'hmi'],
            quiz: [
              q(L('Which button starts the power modules?', '¿Qué botón arranca los módulos de potencia?'), [L('Green RUN', 'RUN verde'), L('Red STOP', 'STOP rojo'), L('Emergency', 'Emergencia')], 0),
              q(L('Where is the event log downloaded from?', '¿Desde dónde se descarga el registro de eventos?'), [L('The HMI', 'El HMI'), L('The fuse box', 'La caja de fusibles')], 0),
            ],
          }),
        ],
      },
      {
        id: 's-mt',
        title: L('Maintenance', 'Mantenimiento'),
        steps: [
          step('hem-mt-1', 'video', L('Changing the DC switch lever', 'Cambio de la palanca del seccionador DC'), L('Step by step replacement of the lever of the second panel.', 'Sustitución paso a paso de la palanca del segundo panel.'), { tags: ['lever', 'dc', 'maintenance'], partId: 'p-lever' }),
          step('hem-mt-2', 'text', L('Cooling filter cleaning', 'Limpieza de filtros de refrigeración'), L('Vacuum first, never compressed air. Replace the filter when airflow drops below 85%.', 'Aspira primero, nunca con aire comprimido. Sustituye el filtro si el caudal baja del 85%.'), { tags: ['cooling', 'maintenance'], partId: 'p-fans' }),
          step('hem-mt-3', 'test', L('Maintenance check', 'Test de mantenimiento'), L('Three questions about maintenance.', 'Tres preguntas sobre mantenimiento.'), {
            tags: ['maintenance', 'lever'],
            quiz: [
              q(L('How should dusty filters be cleaned?', '¿Cómo se limpian los filtros con polvo?'), [L('Compressed air', 'Aire comprimido'), L('Vacuum', 'Aspirador'), L('Water', 'Agua')], 1),
              q(L('Before changing the lever you must…', 'Antes de cambiar la palanca debes…'), [L('Apply LOTO', 'Aplicar LOTO'), L('Increase power', 'Subir la potencia')], 0),
            ],
          }),
        ],
      },
    ],
  },
  {
    id: 'c-safety',
    code: 'LOTO',
    area: 'safety',
    level: 'basic',
    source: 'corporate',
    path: ['COURSES', 'SAFETY', 'LOTO'],
    tags: ['safety', 'loto'],
    title: L('Electrical Safety & LOTO', 'Seguridad eléctrica y LOTO'),
    description: L('Lockout/tagout, PPE and the five golden rules for field technicians.', 'Bloqueo y etiquetado, EPIs y las cinco reglas de oro para técnicos de campo.'),
    sections: [
      {
        id: 's-rules',
        title: L('Five golden rules', 'Cinco reglas de oro'),
        steps: [
          step('loto-1', 'video', L('Disconnect and lock', 'Desconectar y bloquear'), L('Open all sources and lock them out.', 'Abre todas las fuentes y bloquéalas.'), { tags: ['safety', 'loto'], partId: 'p-ac-breaker' }),
          step('loto-2', 'text', L('Verify absence of voltage', 'Verificar ausencia de tensión'), L('Use a tested voltage detector on every conductor.', 'Usa un detector de tensión verificado en cada conductor.'), { tags: ['safety', 'dc'] }),
          step('loto-3', 'test', L('Safety quiz', 'Test de seguridad'), L('Check your knowledge.', 'Comprueba tus conocimientos.'), {
            tags: ['safety', 'loto'],
            quiz: [q(L('The first golden rule is…', 'La primera regla de oro es…'), [L('Disconnect', 'Desconectar'), L('Earth', 'Poner a tierra')], 0)],
          }),
        ],
      },
      {
        id: 's-ppe',
        title: L('Personal protective equipment', 'Equipos de protección individual'),
        steps: [
          step('loto-4', 'document', L('Arc-flash PPE categories', 'Categorías de EPI contra arco eléctrico'), L('Choosing the right PPE category for each task.', 'Cómo elegir la categoría de EPI adecuada para cada tarea.'), { tags: ['safety'] }),
        ],
      },
    ],
  },
  {
    id: 'c-sd700',
    code: 'SD700',
    area: 'drives',
    level: 'basic',
    source: 'corporate',
    path: ['COURSES', 'DRIVES', 'SD700'],
    tags: ['drives', 'software'],
    title: L('SD700 Variable Speed Drives', 'Variadores de velocidad SD700'),
    description: L('Installation, parametrisation and diagnostics of the SD700 drive family.', 'Instalación, parametrización y diagnóstico de la familia de variadores SD700.'),
    sections: [
      {
        id: 's-install',
        title: L('Installation', 'Instalación'),
        steps: [
          step('sd-1', 'video', L('Mounting and wiring', 'Montaje y cableado'), L('Clearances, cable sections and earthing.', 'Distancias, secciones de cable y puesta a tierra.'), { tags: ['drives', 'hardware'] }),
          step('sd-2', 'document', L('Quick start guide', 'Guía rápida'), L('The ten parameters to set before first run.', 'Los diez parámetros a ajustar antes del primer arranque.'), { tags: ['drives', 'software'] }),
        ],
      },
      {
        id: 's-diag',
        title: L('Diagnostics', 'Diagnóstico'),
        steps: [
          step('sd-3', 'text', L('Reading fault codes', 'Lectura de códigos de fallo'), L('Most frequent trips and how to clear them.', 'Disparos más frecuentes y cómo eliminarlos.'), { tags: ['drives', 'software'] }),
          step('sd-4', 'test', L('Diagnostics quiz', 'Test de diagnóstico'), L('Check your knowledge.', 'Comprueba tus conocimientos.'), {
            tags: ['drives'],
            quiz: [q(L('An overcurrent trip usually points to…', 'Un disparo por sobrecorriente suele indicar…'), [L('Short acceleration ramp', 'Rampa de aceleración corta'), L('Low ambient temperature', 'Temperatura ambiente baja')], 0)],
          }),
        ],
      },
    ],
  },
  {
    id: 'c-modules',
    code: 'PWR',
    area: 'power',
    level: 'basic',
    source: 'corporate',
    path: ['COURSES', 'POWER', 'MODULES'],
    tags: ['power-module', 'hardware'],
    title: L('Power Modules: Theory & Handling', 'Módulos de potencia: teoría y manipulación'),
    description: L('IGBT basics, thermal management and safe handling of power stacks.', 'Fundamentos de IGBT, gestión térmica y manipulación segura de los módulos.'),
    sections: [
      {
        id: 's-theory',
        title: L('Theory', 'Teoría'),
        steps: [
          step('pm-1', 'text', L('How an IGBT inverter works', 'Cómo funciona un inversor IGBT'), L('PWM switching, DC link and output filters.', 'Conmutación PWM, bus DC y filtros de salida.'), { tags: ['power-module'] }),
          step('pm-2', '3d', L('Thermal path', 'Camino térmico'), L('Explore how heat flows from the chip to the air.', 'Explora cómo fluye el calor desde el chip hasta el aire.'), { tags: ['power-module', 'cooling'], partId: 'p-power-module' }),
        ],
      },
      {
        id: 's-handling',
        title: L('Handling', 'Manipulación'),
        steps: [
          step('pm-3', 'video', L('ESD-safe handling', 'Manipulación segura ESD'), L('Wrist straps, packaging and storage.', 'Pulseras, embalaje y almacenamiento.'), { tags: ['power-module', 'safety'] }),
          step('pm-4', 'test', L('Handling quiz', 'Test de manipulación'), L('Check your knowledge.', 'Comprueba tus conocimientos.'), {
            tags: ['power-module'],
            quiz: [q(L('Modules must be stored in…', 'Los módulos se almacenan en…'), [L('ESD bags', 'Bolsas ESD'), L('Open shelves', 'Estanterías abiertas')], 0)],
          }),
        ],
      },
    ],
  },
  {
    id: 'c-hemk-adv',
    code: 'HEMK',
    area: 'solar',
    level: 'advanced',
    source: 'corporate',
    path: ['COURSES', 'SOLAR', 'HEMK'],
    equipmentId: 'freesun-hemk',
    tags: ['solar', 'freesun', 'troubleshooting', 'power-module', 'lever'],
    title: L('Freesun HEMK Advanced Troubleshooting', 'Diagnóstico avanzado Freesun HEMK'),
    description: L('Root cause analysis of the most frequent field failures, built from Technical Assistance data.', 'Análisis de causa raíz de los fallos de campo más frecuentes, construido con datos de Asistencia Técnica.'),
    sections: [
      {
        id: 's-faults',
        title: L('Frequent faults', 'Fallos frecuentes'),
        steps: [
          step('adv-1', 'video', L('Stuck DC switch lever', 'Palanca del seccionador DC atascada'), L('Why it happens and how to fix it at first attempt.', 'Por qué ocurre y cómo resolverlo a la primera.'), { tags: ['lever', 'troubleshooting'], partId: 'p-lever' }),
          step('adv-2', 'text', L('IGBT overtemperature trips', 'Disparos por sobretemperatura del IGBT'), L('Check fans, thermal paste and ambient derating.', 'Revisa ventiladores, pasta térmica y derating por temperatura.'), { tags: ['power-module', 'cooling', 'troubleshooting'], partId: 'p-power-module' }),
          step('adv-3', 'text', L('Insulation faults on DC inputs', 'Fallos de aislamiento en entradas DC'), L('Measuring and locating insulation faults string by string.', 'Medición y localización de fallos de aislamiento string a string.'), { tags: ['dc', 'fuses', 'troubleshooting'], partId: 'p-dc-fuses' }),
        ],
      },
      {
        id: 's-case',
        title: L('Case studies', 'Casos prácticos'),
        steps: [
          step('adv-4', 'test', L('Troubleshooting challenge', 'Reto de diagnóstico'), L('Solve three real cases.', 'Resuelve tres casos reales.'), {
            tags: ['troubleshooting'],
            quiz: [
              q(L('Module trips by overtemperature at noon. First check…', 'El módulo dispara por sobretemperatura a mediodía. Primero revisas…'), [L('Fan filters', 'Filtros de ventiladores'), L('Grid code', 'Código de red')], 0),
              q(L('Repeated blown fuse on the same DC input suggests…', 'Un fusible que se funde repetidamente en la misma entrada DC sugiere…'), [L('Insulation fault', 'Fallo de aislamiento'), L('Firmware bug', 'Error de firmware')], 0),
            ],
          }),
        ],
      },
    ],
  },
  {
    id: 'c-pv-maint',
    code: 'PVM',
    area: 'solar',
    level: 'advanced',
    source: 'corporate',
    path: ['COURSES', 'SOLAR', 'MAINTENANCE'],
    tags: ['solar', 'maintenance', 'cooling'],
    title: L('Preventive Maintenance Planning for PV Plants', 'Planificación del mantenimiento preventivo en plantas FV'),
    description: L('Build maintenance plans that reduce urgent interventions.', 'Diseña planes de mantenimiento que reduzcan las intervenciones urgentes.'),
    sections: [
      {
        id: 's-plan',
        title: L('Planning', 'Planificación'),
        steps: [
          step('pvm-1', 'document', L('Maintenance calendar template', 'Plantilla de calendario de mantenimiento'), L('Quarterly and annual tasks per component.', 'Tareas trimestrales y anuales por componente.'), { tags: ['maintenance'] }),
          step('pvm-2', 'text', L('Using alerts to plan visits', 'Usar las alertas para planificar visitas'), L('Group preventive alerts to reduce travel.', 'Agrupa alertas preventivas para reducir desplazamientos.'), { tags: ['maintenance', 'cooling'] }),
        ],
      },
    ],
  },
  {
    id: 'c-cabinets',
    code: 'CAB',
    area: 'power',
    level: 'advanced',
    source: 'corporate',
    path: ['COURSES', 'POWER', 'CABINETS'],
    tags: ['hardware', 'ac', 'safety'],
    title: L('Electrical Cabinets: Wiring & Commissioning', 'Cuadros eléctricos: cableado y puesta en marcha'),
    description: L('Wiring standards, torque checks and commissioning tests.', 'Normas de cableado, control de pares y pruebas de puesta en marcha.'),
    sections: [
      {
        id: 's-wiring',
        title: L('Wiring', 'Cableado'),
        steps: [
          step('cab-1', 'video', L('Busbar torque procedure', 'Procedimiento de par del embarrado'), L('Torque sequence and marking.', 'Secuencia de apriete y marcado.'), { tags: ['hardware'] }),
          step('cab-2', '3d', L('AC breaker assembly', 'Montaje del interruptor AC'), L('Explore the breaker in 3D.', 'Explora el interruptor en 3D.'), { tags: ['ac', 'hardware'], partId: 'p-ac-breaker' }),
          step('cab-3', 'test', L('Commissioning quiz', 'Test de puesta en marcha'), L('Check your knowledge.', 'Comprueba tus conocimientos.'), {
            tags: ['hardware'],
            quiz: [q(L('After torquing a connection you should…', 'Tras apretar una conexión debes…'), [L('Mark it', 'Marcarla'), L('Paint it', 'Pintarla')], 0)],
          }),
        ],
      },
    ],
  },
  {
    id: 'c-grid',
    code: 'GRID',
    area: 'solar',
    level: 'advanced',
    source: 'moodle',
    path: ['COURSES', 'SOLAR', 'GRID'],
    tags: ['software', 'grid'],
    title: L('Grid Codes & Parameter Configuration', 'Códigos de red y configuración de parámetros'),
    description: L('Moodle course: international grid codes and how they map to inverter parameters.', 'Curso Moodle: códigos de red internacionales y su traducción a parámetros del inversor.'),
    sections: [
      {
        id: 's-codes',
        title: L('Grid codes', 'Códigos de red'),
        steps: [
          step('grid-1', 'document', L('Grid code comparison', 'Comparativa de códigos de red'), L('Spain, UK, USA and Australia side by side.', 'España, Reino Unido, EE. UU. y Australia comparados.'), { tags: ['grid'] }),
          step('grid-2', 'text', L('Reactive power control', 'Control de potencia reactiva'), L('Q(U) and cos φ modes explained.', 'Modos Q(U) y cos φ explicados.'), { tags: ['grid', 'software'] }),
        ],
      },
    ],
  },
];
