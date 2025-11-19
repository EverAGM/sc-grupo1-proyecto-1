# ContaCorp - Frontend 💻

Sistema contable integral con módulo de facturación electrónica desarrollado en React + Vite.

## 👥 Equipo de Desarrollo

- **Grupo 1** - Sistemas Contables
- **Proyecto** - ContaCorp
- **Integrantes - Carnet**


1. Agueda Rosales, Diego Alexander - AR23010
2. Díaz Linarez, Daniel Alejandro - DL23001
3. Granadino Mendoza, Ever Alexander - GM23004
4. Linares Pacheco, Fernando José - LP23006
5. Mejía Ramírez, Jonathan Javier - MR23005
6. Mendoza Ramos, Miguel Angel - MR23061
7. Olivares Martínez, Diego Enrique - OM23008



## 🚀 Características

### 📊 Módulos Principales
- **📋 Cuentas Contables** - Gestión del plan de cuentas
- **💸 Transacciones** - Registro de movimientos contables
- **📅 Períodos Contables** - Administración de períodos fiscales
- **⚖️ Balance** - Visualización de estados financieros
- **📈 Reportes** - Generación de reportes contables
- **🧾 Facturación Electrónica** - Sistema completo de facturación

### 🎨 Tecnologías Utilizadas
- **React 18** - Framework de frontend
- **Vite** - Herramienta de desarrollo y build
- **React Router** - Navegación entre páginas
- **Ant Design** - Biblioteca de componentes UI
- **React Icons** - Iconografía moderna
- **React Toastify** - Notificaciones toast
- **Moment.js** - Manejo de fechas

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/EverAGM/sc-grupo1-proyecto-1.git
cd sc-grupo1-proyecto-1/FE

# Instalar dependencias
npm install
```

## 🐳 Levantar proyecto (Dockerizado)

```bash
#Debes de configurar el .env en la raíz del proyecto para colocar las configuraciones de tu base de datos

docker compose up # En la raíz del proyecto
```


## 📂 Estructura del Proyecto

```
FE/
├── public/              # Archivos estáticos
├── src/
│   ├── assets/          # Recursos (imágenes, iconos)
│   ├── pages/           # Componentes de páginas
│   │   ├── IndexPage.jsx           # Dashboard principal
│   │   ├── TransaccionesPage.jsx   # Gestión de transacciones
│   │   ├── BalancePage.jsx         # Estados financieros
│   │   ├── ReportesPage.jsx        # Reportes contables
│   │   ├── PeriodosPage.jsx        # Períodos contables
│   │   ├── CuentasContablesPage.jsx # Plan de cuentas
│   │   └── FacturacionPage.jsx     # Facturación electrónica
│   ├── services/        # Servicios de API
│   │   ├── transaccionesService.js
│   │   ├── reportesService.js
│   │   └── facturacionService.js
│   ├── router.jsx       # Configuración de rutas
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Punto de entrada
├── package.json
└── vite.config.js       # Configuración de Vite
```

## 🧾 Módulo de Facturación Electrónica

### Funcionalidades Principales
- ✅ **CRUD Completo** - Crear, leer, actualizar y eliminar facturas
- ✅ **Estados de Factura** - BORRADOR, ENVIADA, ACEPTADA, RECHAZADA, ANULADA
- ✅ **Generación de CUFE** - Código Único de Facturación Electrónica automático
- ✅ **Validación de Totales** - Cálculo automático de subtotal + impuestos
- ✅ **Filtros y Búsqueda** - Filtrar facturas por estado
- ✅ **Modal de Detalles** - Vista completa de información de factura
- ✅ **Integración Completa** - Conectado con períodos contables

### Campos de Factura
- Número de factura (único)
- Fecha de emisión
- Cliente (nombre completo)
- Descripción de productos/servicios
- Subtotal, impuestos y total
- Estado de facturación electrónica
- CUFE (generado automáticamente)
- Período contable asociado

## 🎯 Rutas de la Aplicación

```
/                    # Dashboard principal
/cuentas-contables   # Gestión del plan de cuentas
/transacciones       # Registro de movimientos
/periodos           # Administración de períodos
/balance            # Estados financieros
/reportes           # Reportes contables
/facturacion        # Facturación electrónica
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
El frontend se conecta al backend en `http://localhost:3000` por defecto.

## cambiar muy especifico
### API Endpoints
- `GET /api/facturacion-electronica` - Listar facturas
- `POST /api/facturacion-electronica` - Crear factura
- `PUT /api/facturacion-electronica/:id` - Actualizar factura
- `DELETE /api/facturacion-electronica/:id` - Eliminar factura

## 🎨 Estilos y Temas

- **Ant Design** para componentes base
- **CSS personalizado** para estilos específicos
- **Diseño responsive** compatible con móviles
- **Esquema de colores** moderno y profesional


## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es parte del curso de Sistemas Contables - Universidad.

---

**🎯 ContaCorp** - Sistema contable moderno con facturación electrónica integrada.

