# LIGO — Portal de plantillas editables

**LIGO** es un portal web privado para estudios de diseño gráfico que permite a los clientes acceder a sus plantillas de comunicación, completar los campos editables y descargar el resultado como PDF (para imprenta) o PNG (para uso digital), sin necesidad de software de diseño.

En esperanto, *ligo* significa enlace. Eso es exactamente lo que este sistema construye: un enlace directo y práctico entre el trabajo del diseñador y el de su cliente.

---

## ¿Qué hace LIGO?

**Para el diseñador (administrador):**
- Panel de administración para gestionar clientes, usuarios y plantillas
- Subida de PDFs preparados en InDesign o Affinity Publisher
- Detección automática de campos editables mediante marcadores de texto (`{{CAMPO}}`)
- Detección automática de campos QR mediante rectángulos magenta (#FF00FF)
- Biblioteca de fuentes reutilizables
- Configuración de alineación, color y tipografía por campo
- Historial de descargas por cliente

**Para el cliente:**
- Login privado con acceso solo a sus plantillas
- Formulario con los campos a completar, con valores por defecto opcionales
- Previsualización del QR en tiempo real
- Descarga en PDF (alta resolución para imprenta) o PNG (para web y redes sociales)
- Historial de descargas propias

---

## Stack tecnológico

- **Frontend:** React + Vite + Tailwind CSS
- **Base de datos y autenticación:** Supabase (PostgreSQL + Auth + Storage)
- **Procesamiento PDF:** pdf-lib + pdfjs-dist
- **Generación de QR:** qrcode.js
- **Deploy:** archivos estáticos en cualquier hosting con Apache

---

## Requisitos para instalar

- Node.js 18+ (solo para compilar el proyecto)
- Cuenta gratuita en [Supabase](https://supabase.com)
- Hosting compartido con soporte Apache y capacidad de crear subdominios

---

## Instalación para desarrolladores

```bash
# 1. Clonar el repositorio
git clone https://github.com/RodrigoMazza/ligo.git
cd ligo

# 2. Instalar dependencias
npm install

# 3. Configurar las variables
cp public/assets/config.js.example public/assets/config.js
# Editar config.js con tus claves de Supabase

# 4. Ejecutar el schema en Supabase
# Ir a Supabase Dashboard → SQL Editor → pegar y ejecutar supabase/schema.sql

# 5. Levantar en desarrollo
npm run dev

# 6. Compilar para producción
npm run build
# Subir el contenido de dist/ al hosting
```

---

## Instalación sin conocimientos técnicos

El paquete de distribución incluye un asistente web (`instalador.html`) que guía el proceso paso a paso sin necesidad de terminal ni conocimientos de programación.

**Descargar el paquete listo para instalar:** [ver releases](https://github.com/RodrigoMazza/ligo/releases)

La guía de instalación completa está disponible en el archivo `LIGO-guia-instalacion.docx` incluido en el paquete.

---

## Cómo preparar los PDFs

### Campos de texto editables

En InDesign o Affinity Publisher, colocá marcadores de texto en el formato:

```
{{NOMBRE_DEL_CAMPO}}
```

El marcador debe quedar oculto debajo del fondo de la pieza. Si no hay fondo, creá un rectángulo blanco del tamaño de la página como capa base y ponelo por encima del marcador.

> **Importante para Affinity Publisher:** la opacidad 0% no exporta el elemento al PDF. Siempre usá el método del fondo como cobertura.

### Campos QR

Dibujá un rectángulo con relleno exactamente `#FF00FF` (magenta puro) en la posición donde va el QR. El sistema lo detecta automáticamente y lo reemplaza con el QR generado por el cliente a partir de la URL que ingrese.

### Exportación

- Fuentes embebidas completas (no subconjunto, no convertir a curvas)
- Modo de color según destino: RGB para pantalla, CMYK para imprenta
- Formato PDF estándar

---

## Estructura del proyecto

```
ligo/
├── public/
│   └── assets/
│       └── config.js.example   ← plantilla de configuración
├── src/
│   ├── components/             ← componentes React
│   ├── context/                ← AuthContext
│   ├── lib/                    ← pdfScanner, pdfProcessor, qrGenerator, cloudflare
│   ├── pages/                  ← Dashboard, TemplatePage, Admin*, Login, Historial
│   └── services/               ← supabase, templates, fonts, storage
├── supabase/
│   └── schema.sql              ← schema completo de base de datos
├── instalador.html             ← asistente de instalación standalone
└── README.md
```

---

## Desarrollo y contribuciones

Este proyecto fue construido con [Claude Code](https://claude.ai/code) como herramienta de desarrollo principal. El proceso completo está documentado en el canal de YouTube de Rodrigo Mazza.

Si encontrás un bug o tenés una sugerencia, podés abrir un issue en este repositorio.

---

## Créditos

Desarrollado por **Rodrigo Mazza** — diseñador gráfico y publicista con base en Rosario, Argentina.

- Sitio web: [rodrigomazza.com](https://rodrigomazza.com)
- Canal de YouTube: documentación del proceso de desarrollo con IA

---

## Licencia

MIT — podés usar, modificar y distribuir este proyecto libremente, con atribución.
