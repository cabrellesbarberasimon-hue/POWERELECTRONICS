# SENSE: prototipo beta

> *"¿Has soñado con poder tocar todo lo que imaginas?"*

SENSE es una app móvil de formación corporativa y *social co-learning* para **Power Electronics**. Nació del reto
"Formación Corporativa en la Era Post-Covid" (programa Gennera de la Universitat de València). Junta en una sola app
la **Universidad Corporativa**, un entrenamiento con **Realidad Aumentada** (*Training Experience 4.0*), una
**Red Social corporativa** y una **capa de IA** que recomienda contenidos y genera retos.

Este repositorio contiene el **prototipo beta con funciones básicas**. Todo funciona con datos simulados, así que se
puede probar en Expo Go, en un emulador o en el navegador sin backend ni hardware especial.

---

## 1. Cómo probarlo

Requisitos: Node 20 o superior y npm. Opcional: la app **Expo Go** en el móvil (SDK 57), o un emulador Android/iOS.

```bash
npm install
npx expo start          # escanea el QR con Expo Go (Android) o con la cámara (iOS)
#   pulsa  a  → emulador Android
#   pulsa  i  → simulador iOS
#   pulsa  w  → navegador (react-native-web)
```

Comprobaciones:

```bash
npm run typecheck       # TypeScript estricto
npm run lint            # ESLint (eslint-config-expo + reglas del React Compiler)
npm test                # Jest: IA, puntuación, progreso, licencias, servicios
npm run check           # las tres anteriores
```

### Cuentas de demo (contraseña: `sense`)

| Usuario | Rol | Qué enseñar |
|---|---|---|
| `trainee` | Empleado en formación (Daniel, ES) | Universidad, lecciones, test, RA paso a paso, recomendaciones de la IA |
| `technician` | Técnico SAT (Emily, UK) | Vista *Assistance*: alertas, historial, notificaciones, videollamada |
| `instructor` | Instructor / evaluador (Pedro, ES) | Valorar contenido con ⭐ (privado), publicar lecciones Moodle, retos |
| `admin` | Administrador (Marta, ES) | Panel: KPIs, usuarios y roles, retos con IA, licencia por tramos |

En la pantalla de login las cuentas aparecen como *chips*: basta con pulsar una.
**Cuenta → Restaurar datos de demo** devuelve la base simulada a su estado inicial.

### Recorrido sugerido (unos 5 minutos)

1. Splash azul → **Sign In** (huella si el dispositivo la tiene) → menú con los 3 módulos (Figura 1).
2. **Corporate University** → *Basic Training* → **Freesun HEM/HEMK Fundamentals** → temario desplegable → lección 3D →
   test → pestaña **Community** → botón **+** → *Post Content* (cámara con avatar animado).
3. **TRAINING EXPERIENCE** → *Modo demo* → **Step by Step**: toca la pieza que parpadea y completa el paso con ✓.
   Después **Free Selection** y el panel lateral *TRAINING EXPERIENCE* con los parámetros (Figura 3.1).
4. Pestaña **Assistance** → Alerts / Technical History / Team Notifications / *Ask Team in Real Time* → videollamada
   en la que el instructor marca la palanca sobre la RA (Figura 3.2).
5. **Social Media**: feed vertical, reacciones 👍 😲 💡, comentarios, retos, ranking y perfil con la aportación.
6. Entra como `instructor` y valora posts con estrellas. Entra como `admin` y abre Licencia → proyección de la Tabla 3.

---

## 2. Arquitectura

```
src/
├── app/                    Expo Router (cada archivo es una pantalla)
│   ├── index.tsx           Splash
│   ├── login.tsx           Sign In + biometría
│   └── (app)/              Zona autenticada (guard en _layout.tsx)
│       ├── home.tsx        Menú de los 3 módulos + recomendaciones IA
│       ├── university/     Levels/Courses, curso (Corporate/Community), lección, Add Content, Moodle
│       ├── create-post.tsx Creador de contenido: cámara + avatar + anotación
│       ├── training/       Selección de equipo, Training/Assistance (RA), alerts, history, notifications
│       ├── call/           Teclado + contactos, videollamada simulada
│       ├── social/         Feed, post + comentarios + ⭐, retos, ranking, perfil, búsqueda
│       ├── admin/          KPIs, evaluación, retos IA, usuarios/roles, licencia
│       ├── account.tsx     Perfil, idioma, biometría, reset demo
│       └── certificates.tsx
├── modules/                Lógica y componentes por dominio
│   ├── ai/                 Motor de recomendaciones/retos (interfaz + implementación por reglas)
│   ├── auth/               Biometría (expo-local-authentication)
│   ├── university/         Progreso, notas de test, CourseRow
│   ├── training/           ARView, ilustración del armario Freesun, PartPanel
│   ├── social/             Puntuación de la aportación, progreso de retos, reacciones, tarjetas
│   └── admin/              Tramos de licencia, proyección de negocio, gráfico
├── services/               Capa de datos
│   ├── types.ts            Contratos (AuthService, UniversityService, SocialService…)
│   ├── mock/               Implementación simulada en memoria + AsyncStorage
│   └── index.ts            `api`: el único punto que habría que cambiar para ir a producción
├── hooks/api.ts            Hooks de TanStack Query (queries + mutations con invalidación)
├── stores/session.ts       Zustand (usuario, idioma, biometría) persistido
├── data/                   Datos semilla realistas (en/es)
├── i18n/                   i18next: en (por defecto, como los mockups) + es
├── shared/components/      Kit de UI: botones, cabeceras, tabs, anillos de progreso, parámetros,
│                           media, avatares animados, anotación, cámara con fallback, visor 3D
├── theme/                  Colores medidos en los mockups, tipografía Poppins, espaciados
└── types/domain.ts         Modelo de dominio compartido
```

- **Stack**: React Native 0.86 + Expo SDK 57 + TypeScript estricto, Expo Router, Zustand, TanStack Query, i18next,
  react-native-svg, expo-camera, expo-local-authentication.
- **Flujo de datos**: pantalla → hook (`src/hooks/api.ts`) → `api.<servicio>` → mock. Las mutaciones invalidan su
  dominio y también `ai`, así que las recomendaciones se recalculan después de cada acción.
- **Diseño**: azul `#1E88C4`, azul marino `#06205B` y naranja `#FE6320` (medidos en los mockups), fondos
  blancos y grises, tarjetas redondeadas, iconos lineales azules y la tipografía Poppins.
- **Referencias visuales**: `assets/reference/` guarda las figuras extraídas del diario de innovación (Figuras 0–3.2).

### Capa de IA

`src/modules/ai` define la interfaz `RecommendationEngine`, con `recommend()` y `generateChallenges()`. Las dos
funciones son asíncronas. La implementación actual, `RuleBasedEngine`, puntúa:

- las lecciones **falladas** o marcadas con "he tenido dificultades";
- la **siguiente lección** de cada curso empezado;
- las etiquetas y piezas "calientes" según las **alertas abiertas** (urgentes con más peso) y el **historial
  técnico** de los últimos 90 días (las reparaciones que necesitaron una segunda visita pesan más);
- el contenido de la comunidad relacionado, con peso extra para las reacciones 💡;
- el entrenamiento RA de las piezas con más incidencias.

Cada recomendación incluye sus **motivos**, que se muestran al usuario. `generateChallenges()` propone retos
mensuales y trimestrales a partir de las mismas señales y el admin puede crearlos con un toque.
Para cambiar el motor: `setEngine(new MiMotorLLM())` al arrancar la app. Las pantallas no cambian.

---

## 3. Qué está simulado

| Funcionalidad | En el prototipo | Para producción |
|---|---|---|
| Backend / datos | Base en memoria + AsyncStorage (`src/services/mock`) | Implementar `Services` con Supabase (esquema en `supabase/schema.sql`) o un API propio |
| Autenticación | Usuarios de demo, contraseña compartida | Supabase Auth / SSO corporativo (Azure AD). La biometría desbloquearía un *refresh token* guardado en `expo-secure-store` |
| Realidad Aumentada | Cámara real (o imagen demo) + "detección" temporizada + armario SVG con *hotspots* en coordenadas relativas | Ver §4 |
| Modelos 3D | Visor SVG propio (arrastrar para rotar) | glTF con `expo-gl` + `three` / `@react-three/fiber`, o RA nativa |
| Videollamada | Pantalla simulada, anotación remota con guion | WebRTC (LiveKit / `react-native-webrtc`), Agora o Twilio Video; las anotaciones irían por el *data channel* como coordenadas relativas al anclaje RA |
| Vídeo / audio | Reproductores simulados (barra de progreso, onda) | `expo-video` / `expo-audio` con ficheros en Supabase Storage |
| Avatar animado | 4 personajes SVG predefinidos, animados y arrastrables | Escaneo de movimiento (pose estimation, p. ej. MediaPipe) y *rigging*, previsto en la memoria |
| Contenido Moodle | Formulario que crea la lección (o un post si no eres instructor) | Importación SCORM/H5P o la API REST de Moodle |
| Telemetría de parámetros | Valores fijos de los mockups (18w, 3.8 MV, IP55…) | Lectura del SCADA/Power Electronics Cloud del equipo |
| IA | Motor de reglas explicable | Modelo entrenado con el histórico o un LLM (Claude) detrás de la misma interfaz |
| Notificaciones push | No | `expo-notifications` para alertas urgentes y retos |

## 4. Migrar a RA real

1. **Anclaje**: sustituir `ARView` (`src/modules/training/ARView.tsx`) por una vista de RA con *image tracking* sobre
   un marcador del armario Freesun, o *object tracking* con el modelo CAD.
   - **ViroReact** (`@reactvision/react-viro`): `ViroARImageMarker` + `ViroNode` por pieza. Es la opción más
     directa dentro de React Native.
   - **ARKit / ARCore nativos** con un módulo Expo propio (`expo-modules-core`) que exponga los eventos de toque
     sobre las piezas.
   - **Unity as a Library** (AR Foundation) incrustado, si se quieren procedimientos 3D complejos.
2. **Hotspots**: convertir `EquipmentPart.x/y` (posición relativa en la ilustración) en coordenadas 3D relativas al
   anclaje. El resto (procedimientos, parámetros, alertas, sesiones) no cambia.
3. **Build**: ViroReact y los módulos nativos no funcionan en Expo Go. Hay que usar un *development build*
   (`npx expo run:android` / `eas build --profile development`).

---

## 5. Documentos de partida y decisiones

Documentación original (sin modificar, fuera del repositorio): `DIARIO_FINAL_GRUPO_10.pdf`,
`DIARIO_DE_INNOVACIÓN.docx`, `SOCIAL_CO-LEARNING.pptx`, `excel_power.xlsx`, `Hoja_de_cálculo_sin_título.xlsx`.

Contradicciones encontradas y cómo se han resuelto:

- **Cliente objetivo**: >1.200 empleados (p. 3) frente a >1.500 (p. 5 y hoja de cálculo). La app usa los tramos
  0–500 / 500–1500 / >1500.
- **Precio de la licencia**: 2.000 €/mes (PDF y Tabla 3). En la hoja de cálculo aparecen también 30.000 €/año y
  2.500 €/mes (serie de 90.000 €), y `excel_power.xlsx` usa suscripciones de 10 €/usuario. Se ha tomado **2.000 €/mes**.
  Los tramos 0–500 y 500–1500 **no tienen precio** en los documentos: la app usa 600 € y 1.200 € al mes como valores
  de ejemplo, editables desde el panel de admin.
- **Recuperación de la inversión**: el diario dice "en el año tres", pero ese año solo se alcanza el **equilibrio
  anual** (beneficio 0 €). Sumando los años, el saldo es −187.200 € al acabar el año 3 y la inversión se
  **recupera en el año 5**. El panel de licencia muestra los dos datos y hay un test que lo comprueba.
- **Tabla 2**: el diario da 144.000 € y la hoja 159.600 € (salarios distintos para Diseñador y Animador 3D). La app
  usa el valor del diario.
- **Reacciones**: en el PDF los tres emojis se ven como 👍. El .docx aclara 👍 😲 💡, que es lo que usa la app. El
  "10 | 30 | 50" del mockup del feed se interpreta como los contadores de reacciones.
- **Splash y login**: no están en los anexos del PDF, pero sí en el .docx (Figura 0), y se han replicado.
- **Freesun HEMK / HEM**: HEMK es el modelo del equipo y HEM la familia.

---

## 6. Licencia y créditos

Prototipo académico del reto Power Electronics – Gennera (Universitat de València). Equipo: Simón Cabrelles Barberá,
Laura Mascarell Onandía y Jassira Vásconez Cisneros. Las marcas Power Electronics y Freesun pertenecen a sus
titulares.
