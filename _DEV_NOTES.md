# ODP Maker - Contexto de Desarrollo

## Ubicación del Proyecto
`C:\Users\rsantarosa\.gemini\antigravity\playground\primordial-star`

## Descripción
Aplicación web generar Órdenes de Trabajo (ODP) para el taller de Diseño Industrial. Permite ingresar detalles del proyecto, ítems dinámicos y referencias visuales, generando una vista previa A4 para imprimir o guardar como PDF.

## Estado Actual (19 Enero 2026)

### Cambios Recientes
1.  **Checklist de Acabados**:
    *   Se agregaron checkboxes para: Plotter, Router, Láser, Acabados, Ctrl. Calidad.
    *   Se reflejan visualmente en la hoja de impresión (preview).
2.  **Fix de Escala de Imágenes (Tótem)**:
    *   Problema: Imágenes verticales muy altas (como tótems) se salían del contenedor incluso al 20%.
    *   Solución: Se redujo el límite mínimo del slider de `min="20"` a `min="5"` en `app.js` para permitir un escalado mucho menor.

### Despliegue
*   Repositorio: GitHub `disenocorptpc-dot/odp_maker`
*   Hosting: Vercel (Auto-deploy al hacer push a `main`).

## Archivos Clave
*   `index.html`: Estructura y vista previa (papel A4).
*   `app.js`: Lógica de binding, lista dinámica de items y manejo de imágenes (drag & drop, zoom).
*   `styles.css`: Estilos para el editor oscuro y la hoja blanca de impresión.
