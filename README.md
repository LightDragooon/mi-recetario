# 🍽️ Planificador de Comidas Interactivo

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)](https://www.chartjs.org/)

Una aplicación web **frontend pura** diseñada como una herramienta completa para la visualización, creación y gestión de planes de comida semanales. La aplicación es totalmente **client-side**, no requiere backend y puede ser alojada en cualquier plataforma de hosting estático como GitHub Pages.

### 🚀 [Ver la Demo en Vivo](https://lightdragooon.github.io/mi-recetario)

---

![Demo de la aplicación](https://user-images.githubusercontent.com/3997304/222744198-5fe2c72e-d52a-460b-8461-1e1762e58a20.gif) 
---

## ✨ Funcionalidades Principales

La aplicación está organizada en cuatro vistas principales, cada una con un propósito específico:

#### 1. 📅 **Visualizador de Planes**
- **Carga de Planes**: Selecciona planes predefinidos o personalizados.
- **Detalles Expandibles**: Muestra comidas diarias con recetas completas y gráficos de macronutrientes (usando **Chart.js**).
- **Ajuste de Porciones**: Escala fácilmente las cantidades de los ingredientes para múltiples personas.

#### 2. ✏️ **Constructor de Planes Interactivo**
- **Arrastrar y Soltar (Drag & Drop)**: El corazón de la aplicación. Arrastra recetas desde una biblioteca y suéltalas en un calendario semanal para construir tu propio plan.
- **Guardado Personalizado**: Nombra y guarda tus planes, que aparecerán automáticamente en el selector de la vista principal.

#### 3. 🛒 **Catálogo de Precios Personal**
- **Gestión de Costos**: Introduce y guarda los precios de los ingredientes de tu supermercado local para un cálculo de costos preciso y relevante.

#### 4. 📚 **Biblioteca de Recetas Completa**
- **Exploración Sencilla**: Visualiza todas las recetas disponibles en la base de datos.
- **Búsqueda Integrada**: Filtra recetas por nombre para encontrar rápidamente lo que buscas.

---

## 🛠️ Herramientas Adicionales

- **Generador de Lista de Compras Inteligente**: Consolida todos los ingredientes de un día o una semana completa, agrupándolos por categoría y sumando las cantidades.
- **Cálculo de Costo Estimado**: Utiliza tus precios personales para proveer una estimación del costo total de la lista de compras.
- **Exportación de Lista**: Imprime una versión limpia de la lista o cópiala al portapapeles.

---

## 🏛️ Arquitectura y Concepto Central

El objetivo de este proyecto era construir una aplicación potente y fácil de usar, operando sin necesidad de un servidor.

- **Datos Modulares**: La información de recetas y planes se carga de forma asíncrona desde archivos `JSON` estáticos (`BD_RECETAS.json`, `PLANES_SEMANALES.json`), permitiendo actualizar el contenido sin tocar el código fuente.
- **Estado en el Navegador**: Los planes personalizados y los precios de los ingredientes se guardan en el `localStorage` del navegador, creando una experiencia persistente.
- **Renderizado Dinámico**: La interfaz se genera dinámicamente con **JavaScript puro (ES6+)**, manipulando el DOM para ofrecer una experiencia fluida y reactiva.

---

## 🤖 El Proceso de Desarrollo: Colaboración con IA (Gemini)

Este proyecto es un caso de estudio sobre el desarrollo de software asistido por IA, construido en su totalidad mediante una colaboración iterativa con **Gemini**, la IA de Google.

El proceso se basó en el **prompt engineering** como herramienta principal de desarrollo:

1.  **Ideación y Diseño**: Las funcionalidades y la arquitectura fueron definidas y refinadas a través de un diálogo estratégico con la IA.
2.  **Generación de Código Inicial**: El esqueleto HTML, los estilos CSS y las funciones JavaScript iniciales fueron generados por Gemini a partir de descripciones detalladas.
3.  **Desarrollo Iterativo y Refinamiento**: Cada nueva funcionalidad se construyó de forma incremental, discutiendo problemas y soluciones con la IA para generar el código necesario.
4.  **Debugging y Optimización**: Los errores fueron presentados a Gemini para identificar su causa raíz y generar el código corregido.
5.  **Refactorización**: La IA ejecutó directivas estratégicas, como la modularización del código en `index.html`, `style.css` y `app.js` para mejorar la mantenibilidad.

Este enfoque demuestra cómo la IA puede actuar como un socio de desarrollo altamente cualificado, guiando un proyecto desde su concepción hasta su despliegue.

---

## 💻 Cómo Ejecutar Localmente

Para probar el sitio en tu máquina, necesitas servir los archivos desde un servidor local para que la función `fetch()` pueda cargar los archivos JSON correctamente.

### Opción 1: Usando Live Server (VS Code)

1.  Instala la extensión **Live Server** en Visual Studio Code.
2.  Haz clic derecho en el archivo `index.html`.
3.  Selecciona "Open with Live Server".

### Opción 2: Usando Python

1.  Abre una terminal en la carpeta raíz del proyecto.
2.  Ejecuta el siguiente comando:
    ```bash
    python -m http.server
    ```
3.  Abre tu navegador y ve a `http://localhost:8000`.
