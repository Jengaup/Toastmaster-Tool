# TribunaPro — Herramientas para Toastmasters

Aplicación web de herramientas para reuniones Toastmasters, completamente en español, moderna y fácil de usar.

## Módulos

- **Temporizador** — Cronómetro para discursos con indicadores verde/amarillo/rojo
- **Reporte de tiempos** — Registro manual de participantes, exporta CSV
- **Ah-Counter** — Conteo de muletillas por participante
- **Gramática** — Palabra del día, buenos usos y errores
- **Evaluador general** — Notas por segmento y checklist de reunión
- **Datos personalizados** — Campos libres adaptables a cada club

Todos los datos se guardan localmente en el navegador (localStorage). No requiere cuenta ni conexión a internet.

---

## Instalación y desarrollo local

### Requisitos
- Node.js 18 o superior
- npm 9 o superior

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/jengaup/Toastmaster-Tool.git
cd Toastmaster-Tool

# Instalar dependencias
npm install

# Correr en local (modo desarrollo)
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173/Toastmaster-Tool/`

---

## Build de producción

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`.

Para previsualizar el build localmente:

```bash
npm run preview
```

---

## Publicar en GitHub Pages

### Configuración inicial

1. Ve a tu repositorio en GitHub: `https://github.com/jengaup/Toastmaster-Tool`
2. Entra a **Settings → Pages**
3. En **Source**, selecciona **GitHub Actions**
4. El archivo `.github/workflows/deploy.yml` ya está incluido en el repositorio

### Pasos para publicar

1. Realiza un push a la rama `main`
2. El workflow de GitHub Actions se activa automáticamente
3. Espera 1-2 minutos a que termine
4. La aplicación estará disponible en:

```
https://jengaup.github.io/Toastmaster-Tool/
```

### Actualizar la aplicación

Cualquier push a `main` redesplegará automáticamente.

---

## Estructura del proyecto

```
src/
├── types/          # Tipos TypeScript compartidos
├── utils/          # Utilidades (formatTime, storage, export)
├── hooks/          # Custom hooks (useLocalStorage, useTimer)
├── components/
│   ├── ui/         # Componentes reutilizables (Button, Card, Input, Badge)
│   ├── Layout.tsx  # Layout principal con sidebar
│   └── Sidebar.tsx # Navegación lateral
└── views/          # Una vista por módulo
    ├── Temporizador.tsx
    ├── ReporteTemporizador.tsx
    ├── AhCounter.tsx
    ├── Gramatical.tsx
    ├── EvaluadorGeneral.tsx
    └── DatosPersonalizados.tsx
```

### Agregar un nuevo módulo

1. Crea `src/views/NuevoModulo.tsx`
2. Agrega tipos en `src/types/index.ts` si es necesario
3. Agrega la clave de storage en `src/utils/storage.ts`
4. Registra la ruta en `src/App.tsx`
5. Agrega el ítem de navegación en `src/components/Sidebar.tsx`

---

## Stack tecnológico

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [React Router 6](https://reactrouter.com/) con HashRouter
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)

Sin backend. Sin base de datos. Sin cuenta. Funciona 100% en el navegador.
