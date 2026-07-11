# Monitor-Anemia AI (Monorepo)

Sistema de intervención digital contra la anemia infantil en zonas rurales del Perú. El proyecto utiliza un enfoque híbrido de inteligencia artificial offline en el dispositivo móvil y sincronización de datos de bajo consumo a través de una red mesh LoRa.

## Estructura del Monorepo

- **`frontend/`**: Aplicación móvil desarrollada con React Native (Expo) y TypeScript. Incluye base de datos SQLite offline y 3 módulos de Inteligencia Artificial locales (Diagnóstico, Nutrición y Prevención).
- **`backend/`**: API REST construida con Express.js y TypeScript para la centralización de datos y eventual transformación a formato FHIR.

---

## Módulos de Inteligencia Artificial Offline

La aplicación móvil contiene tres módulos de IA diseñados para ejecutarse localmente con modelos optimizados (<4GB RAM):

1. **Módulo de Diagnóstico**: Diagnóstico presuntivo de anemia infantil mediante procesamiento de imágenes de la conjuntiva ocular (clasificador de imágenes optimizado).
2. **Módulo de Nutrición**: Generador de recomendaciones nutricionales y planes de suplementación basados en características individuales (edad, peso, niveles de hemoglobina) y disponibilidad de alimentos locales.
3. **Módulo de Prevención**: Evaluación predictiva de riesgo del entorno familiar (agua potable, saneamiento, historial médico) y emisión de alertas tempranas preventivas.

---

## Configuración y Arranque

### Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- npm (v9 o superior)

### Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del monorepo para instalar las dependencias de todos los proyectos:

```bash
npm install
```

### Ejecutar en Desarrollo

- **Backend**:
  ```bash
  npm run dev:backend
  ```
  La API estará disponible en `http://localhost:5000/health`.

- **Frontend**:
  ```bash
  npm run dev:frontend
  ```
  Esto iniciará el servidor de desarrollo de Expo.

---

## Estilo y Formateo de Código

El monorepo tiene configurado ESLint y Prettier de forma global:

- Para formatear el código:
  ```bash
  npm run format
  ```
- Para analizar errores de código:
  ```bash
  npm run lint
  ```
