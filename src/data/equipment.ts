import type { Alert, Equipment, HistoryEntry, Procedure, TeamNotification } from '@/types/domain';
import { daysAgo } from './time';

const PM_PARAMS = [
  { value: '18w', label: 'POWER' },
  { value: '3.8', label: 'MV' },
  { value: 'IP55', label: 'IP' },
];

export const equipment: Equipment[] = [
  {
    id: 'freesun-hemk',
    name: 'Freesun HEMK',
    family: 'Freesun HEM',
    kind: 'solar-inverter',
    site: 'PV plant · Castellón (ES) · Skid 04',
    description: {
      en: 'Outdoor central solar inverter (1500 V DC) with modular power stacks, cooling system and MV connection.',
      es: 'Inversor solar central de exterior (1500 V DC) con módulos de potencia, sistema de refrigeración y conexión a MT.',
    },
    parts: [
      { id: 'p-fans', name: { en: 'Cooling Fans', es: 'Ventiladores' }, x: 0.13, y: 0.09, dot: 'red', tags: ['cooling', 'maintenance'], parameters: [{ value: '2850', label: 'RPM' }, { value: '62ºC', label: 'TEMP' }, { value: 'IP55', label: 'IP' }] },
      { id: 'p-lever', name: { en: 'DC Switch Lever', es: 'Palanca seccionador DC' }, x: 0.31, y: 0.22, dot: 'red', tags: ['dc', 'safety', 'lever'], parameters: [{ value: '1500', label: 'V DC' }, { value: '2', label: 'PANEL' }, { value: 'OFF', label: 'STATE' }] },
      { id: 'p-power-module', name: { en: 'Power Module', es: 'Módulo de potencia' }, x: 0.31, y: 0.44, dot: 'orange', tags: ['power-module', 'hardware'], parameters: [...PM_PARAMS, ...PM_PARAMS] },
      { id: 'p-dc-fuses', name: { en: 'DC Input Fuses', es: 'Fusibles de entrada DC' }, x: 0.13, y: 0.72, dot: 'blue', tags: ['dc', 'fuses', 'hardware'], parameters: [{ value: '400', label: 'A' }, { value: '1.2', label: 'MΩ ISO' }, { value: 'IP55', label: 'IP' }] },
      { id: 'p-ac-breaker', name: { en: 'AC Circuit Breaker', es: 'Interruptor AC' }, x: 0.29, y: 0.68, dot: 'orange', tags: ['ac', 'safety', 'hardware'], parameters: [{ value: '3.8', label: 'MV' }, { value: '690', label: 'V AC' }, { value: '3200', label: 'A' }] },
      { id: 'p-filter', name: { en: 'Surge & EMC Filter', es: 'Filtro EMC y sobretensiones' }, x: 0.35, y: 0.78, dot: 'red', tags: ['protection', 'maintenance'], parameters: [{ value: 'T2', label: 'SPD' }, { value: '40', label: 'kA' }, { value: 'OK', label: 'STATE' }] },
      { id: 'p-aux', name: { en: 'Auxiliary Services', es: 'Servicios auxiliares' }, x: 0.51, y: 0.72, dot: 'blue', tags: ['auxiliary', 'software'], parameters: [{ value: '230', label: 'V AC' }, { value: '24', label: 'V DC' }, { value: 'UPS', label: 'BACKUP' }] },
      { id: 'p-control', name: { en: 'Control Unit & HMI', es: 'Unidad de control y HMI' }, x: 0.8, y: 0.3, dot: 'green', tags: ['software', 'control', 'hmi'], parameters: [{ value: 'v4.2', label: 'FW' }, { value: 'RUN', label: 'STATE' }, { value: '99.1%', label: 'AVAIL' }] },
    ],
  },
];

export const procedures: Procedure[] = [
  {
    id: 'proc-pm-replace',
    equipmentId: 'freesun-hemk',
    title: { en: 'Power module replacement', es: 'Sustitución de módulo de potencia' },
    steps: [
      { id: 'ps1', partId: 'p-lever', instruction: { en: 'Change lever of the second panel of the String Inverter Cabinet.', es: 'Cambia la palanca del segundo panel del armario del inversor.' } },
      { id: 'ps2', partId: 'p-control', instruction: { en: 'Stop the inverter from the HMI and confirm the "Stopped" state.', es: 'Detén el inversor desde el HMI y confirma el estado "Parado".' } },
      { id: 'ps3', partId: 'p-ac-breaker', instruction: { en: 'Open the AC circuit breaker and apply lockout/tagout.', es: 'Abre el interruptor AC y aplica el bloqueo y etiquetado (LOTO).' } },
      { id: 'ps4', partId: 'p-dc-fuses', instruction: { en: 'Verify absence of voltage on the DC input fuses after 5 minutes of capacitor discharge.', es: 'Verifica la ausencia de tensión en los fusibles DC tras 5 minutos de descarga de condensadores.' } },
      { id: 'ps5', partId: 'p-power-module', instruction: { en: 'Unlock the power module and slide it out using the extraction rails.', es: 'Desbloquea el módulo de potencia y extráelo con los carriles de extracción.' } },
      { id: 'ps6', partId: 'p-power-module', instruction: { en: 'Insert the new module and tighten the busbar connections to 25 N·m.', es: 'Inserta el nuevo módulo y aprieta las conexiones del embarrado a 25 N·m.' } },
      { id: 'ps7', partId: 'p-fans', instruction: { en: 'Check the cooling fans spin freely and clean the air filters.', es: 'Comprueba que los ventiladores giran libremente y limpia los filtros de aire.' } },
      { id: 'ps8', partId: 'p-control', instruction: { en: 'Restore power and run the self-test from the HMI.', es: 'Restablece la alimentación y ejecuta el autotest desde el HMI.' } },
    ],
  },
  {
    id: 'proc-preventive',
    equipmentId: 'freesun-hemk',
    title: { en: 'Quarterly preventive maintenance', es: 'Mantenimiento preventivo trimestral' },
    steps: [
      { id: 'pv1', partId: 'p-control', instruction: { en: 'Download the event log from the HMI.', es: 'Descarga el registro de eventos desde el HMI.' } },
      { id: 'pv2', partId: 'p-fans', instruction: { en: 'Inspect and clean fan filters; replace if airflow < 85%.', es: 'Inspecciona y limpia los filtros; sustitúyelos si el caudal es < 85%.' } },
      { id: 'pv3', partId: 'p-filter', instruction: { en: 'Check the surge protection indicators (green window).', es: 'Comprueba los indicadores de las protecciones de sobretensión (ventana verde).' } },
      { id: 'pv4', partId: 'p-dc-fuses', instruction: { en: 'Measure insulation resistance on each DC input.', es: 'Mide la resistencia de aislamiento en cada entrada DC.' } },
      { id: 'pv5', partId: 'p-aux', instruction: { en: 'Test the UPS of the auxiliary services.', es: 'Prueba el SAI de los servicios auxiliares.' } },
    ],
  },
];

export const alerts: Alert[] = [
  {
    id: 'al-1',
    equipmentId: 'freesun-hemk',
    partId: 'p-lever',
    severity: 'urgent',
    title: { en: 'Necessary Maintenance', es: 'Mantenimiento necesario' },
    trigger: { en: 'Trigger lever', es: 'Palanca de disparo' },
    description: { en: 'Change lever of the second panel of the String Inverter Cabinet.', es: 'Cambia la palanca del segundo panel del armario del inversor.' },
    parameters: [...PM_PARAMS, ...PM_PARAMS],
    createdAt: daysAgo(0.2),
    resolved: false,
  },
  {
    id: 'al-2',
    equipmentId: 'freesun-hemk',
    partId: 'p-fans',
    severity: 'preventive',
    title: { en: 'Preventive Maintenance', es: 'Mantenimiento preventivo' },
    trigger: { en: 'Airflow reduced 18%', es: 'Caudal de aire reducido un 18%' },
    description: { en: 'Cooling fan filters are clogged. Clean or replace them in the next visit.', es: 'Los filtros de los ventiladores están obstruidos. Límpialos o sustitúyelos en la próxima visita.' },
    parameters: [{ value: '62ºC', label: 'TEMP' }, { value: '2850', label: 'RPM' }, { value: 'IP55', label: 'IP' }],
    createdAt: daysAgo(2),
    resolved: false,
  },
  {
    id: 'al-3',
    equipmentId: 'freesun-hemk',
    partId: 'p-dc-fuses',
    severity: 'preventive',
    title: { en: 'Preventive Maintenance', es: 'Mantenimiento preventivo' },
    trigger: { en: 'Insulation trending down', es: 'Aislamiento en descenso' },
    description: { en: 'Insulation resistance on DC input 3 is trending down. Schedule a measurement.', es: 'La resistencia de aislamiento de la entrada DC 3 está bajando. Programa una medición.' },
    parameters: [{ value: '1.2', label: 'MΩ ISO' }, { value: '1500', label: 'V DC' }, { value: '3', label: 'INPUT' }],
    createdAt: daysAgo(5),
    resolved: false,
  },
];

const hist = (
  id: string,
  partId: string,
  technicianId: string,
  days: number,
  severity: HistoryEntry['severity'],
  en: string,
  es: string,
  firstTimeFix = true,
): HistoryEntry => ({
  id,
  equipmentId: 'freesun-hemk',
  partId,
  technicianId,
  date: daysAgo(days),
  severity,
  description: { en, es },
  parameters: partId === 'p-power-module' || partId === 'p-lever' ? PM_PARAMS : [],
  firstTimeFix,
});

export const history: HistoryEntry[] = [
  hist('h-1', 'p-lever', 'u-roberto', 3, 'urgent', 'Change lever of the second panel of the String Inverter Cabinet.', 'Cambio de la palanca del segundo panel del armario del inversor.', false),
  hist('h-2', 'p-lever', 'u-jose', 12, 'urgent', 'Change lever of the second panel of the String Inverter Cabinet.', 'Cambio de la palanca del segundo panel del armario del inversor.'),
  hist('h-3', 'p-power-module', 'u-tech', 20, 'preventive', 'Change lever of the second panel of the String Inverter.', 'Cambio de palanca del segundo panel del inversor.'),
  hist('h-4', 'p-power-module', 'u-julia', 34, 'urgent', 'Power module 2 replaced after IGBT overtemperature trip.', 'Sustitución del módulo de potencia 2 tras disparo por sobretemperatura del IGBT.', false),
  hist('h-5', 'p-fans', 'u-hugo', 41, 'preventive', 'Fan filters cleaned; fan 3 bearing noise reported.', 'Filtros limpiados; ruido en rodamiento del ventilador 3.'),
  hist('h-6', 'p-control', 'u-jorge', 55, 'info', 'Firmware updated to v4.2 and grid code parameters reviewed.', 'Firmware actualizado a v4.2 y revisados los parámetros de código de red.'),
  hist('h-7', 'p-dc-fuses', 'u-oliver', 63, 'urgent', 'Blown fuse on DC input 3 replaced; insulation fault suspected.', 'Fusible fundido en la entrada DC 3 sustituido; se sospecha fallo de aislamiento.', false),
  hist('h-8', 'p-power-module', 'u-sol', 80, 'preventive', 'Power module thermal paste renewed.', 'Renovada la pasta térmica del módulo de potencia.'),
];

export const teamNotifications: TeamNotification[] = [
  { id: 'n-1', equipmentId: 'freesun-hemk', authorId: 'u-jorge', kind: 'video', topic: 'technical', text: { en: 'How I released the stuck lever on panel 2 without removing the cover.', es: 'Cómo liberé la palanca atascada del panel 2 sin quitar la tapa.' }, createdAt: daysAgo(0.1), durationSec: 48 },
  { id: 'n-2', equipmentId: 'freesun-hemk', authorId: 'u-roberto', kind: 'voice', topic: 'technical', text: { en: 'Remember to check the torque of the busbar after replacing the module.', es: 'Acordaos de revisar el par del embarrado tras cambiar el módulo.' }, createdAt: daysAgo(0.4), durationSec: 22 },
  { id: 'n-3', equipmentId: 'freesun-hemk', authorId: 'u-lucia', kind: 'video', topic: 'maintenance', text: { en: 'Filter cleaning in dusty sites: use the vacuum first, never compressed air.', es: 'Limpieza de filtros en zonas con polvo: aspira primero, nunca aire comprimido.' }, createdAt: daysAgo(1), durationSec: 65 },
  { id: 'n-4', equipmentId: 'freesun-hemk', authorId: 'u-instructor', kind: 'video', topic: 'safety', text: { en: 'LOTO reminder: two-person verification before touching DC fuses.', es: 'Recordatorio LOTO: verificación por dos personas antes de tocar los fusibles DC.' }, createdAt: daysAgo(1.5), durationSec: 90 },
  { id: 'n-5', equipmentId: 'freesun-hemk', authorId: 'u-lorena', kind: 'note', topic: 'technical', text: { en: 'HMI shows code E-217 after self-test: it clears after resetting the aux UPS.', es: 'El HMI muestra el código E-217 tras el autotest: desaparece al reiniciar el SAI auxiliar.' }, createdAt: daysAgo(3) },
];
