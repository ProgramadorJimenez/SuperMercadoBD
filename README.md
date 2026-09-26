# API REST Supermercado MarketSoft

Backend para la gestión básica de un supermercado: proveedores, productos, usuarios y ventas. Está construido con **Node.js**, **Express**, **PostgreSQL** y **Sequelize**, siguiendo la arquitectura **MVC**. La API será consumida por el frontend en la siguiente actividad.

## Integrantes y responsabilidades

| Integrante | Responsabilidades |
|---|---|
| **Cristian Felipe Barreto Marulanda** | Estructura inicial del proyecto y dependencias, archivo `server.js`, conexión a PostgreSQL y creación automática de la base de datos, capa de vista (formato de respuestas JSON), middlewares de errores y validación de id, módulo de **Proveedores** (modelo, controlador, rutas y documentación) y configuración base de Swagger. |
| **Juan Camilo Giraldo Aristizabal** | Módulo de **Productos** (validaciones de precio y stock, filtros de búsqueda), módulo de **Usuarios** (correo único, roles y protección del único administrador), definición de las relaciones entre modelos y enrutador principal de la API. |
| **Jefferson Stiven Morales Jimenez** | Módulos de **Ventas** y **Detalle de venta**: cálculo automático del total, control de inventario con transacciones, validación de permisos por rol para vender, documentación Swagger de estos módulos y elaboración del README. |

## Tecnologías

- Node.js 18 o superior
- Express 4
- PostgreSQL 13 o superior
- Sequelize 6 (ORM)
- Swagger UI (documentación de la API)

## Instrucciones de ejecución

1. Tener instalado **Node.js** y **PostgreSQL** con el servicio encendido.

2. Clonar el repositorio e instalar las dependencias:

   ```bash
   git clone <url-del-repositorio>
   cd supermercado-marketsoft-api
   npm install
   ```

3. Configurar la conexión. Copiar el archivo `.env.example` con el nombre `.env` y colocar la contraseña del usuario de PostgreSQL:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=supermercado
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

   Si no se crea el archivo `.env`, la aplicación usa esos mismos valores por defecto.

4. Iniciar el servidor:

   ```bash
   npm start
   ```

   **No es necesario crear la base de datos manualmente.** Al iniciar, la aplicación crea la base de datos `supermercado` si no existe y genera todas las tablas con sus relaciones.

5. Abrir en el navegador:
   - API: http://localhost:3000
   - Documentación Swagger: http://localhost:3000/api-docs

## Estructura del proyecto

```
supermercado-marketsoft-api/
├── server.js                  # Punto de entrada: Express, base de datos y rutas
├── package.json
├── .env.example
└── src/
    ├── config/
    │   ├── database.js        # Conexión Sequelize a PostgreSQL
    │   └── roles.js           # Roles de usuario y permisos de venta
    ├── models/                # MODELO: entidades Sequelize
    │   ├── index.js           # Carga de modelos y relaciones
    │   ├── proveedor.js
    │   ├── producto.js
    │   ├── usuario.js
    │   ├── venta.js
    │   └── detalleVenta.js
    ├── controllers/           # CONTROLADOR: lógica de negocio
    │   ├── proveedorController.js
    │   ├── productoController.js
    │   ├── usuarioController.js
    │   ├── ventaController.js
    │   └── detalleVentaController.js
    ├── helpers/
    │   └── ventaHelper.js     # Inventario y cálculo del total de ventas
    ├── views/
    │   └── respuesta.js       # VISTA: formato estándar de las respuestas JSON
    ├── docs/                  # VISTA: documentación Swagger (OpenAPI 3)
    ├── routes/                # Rutas: solo conectan URL con controlador
    ├── middlewares/           # Manejo de errores, id inválido, ruta inexistente
    └── utils/                 # Error personalizado, validaciones y creación de la BD
```

### Arquitectura MVC

- **Modelo (`src/models`)**: define las entidades, sus validaciones y relaciones con Sequelize.
- **Vista (`src/views` y `src/docs`)**: todas las respuestas salen en JSON con el mismo formato y están documentadas en Swagger.
- **Controlador (`src/controllers`)**: recibe la petición, aplica las reglas de negocio y usa los modelos.
- Las **rutas** no contienen lógica, solo asocian cada endpoint con su controlador.

## Modelo de datos

| Entidad | Tabla | Campos |
|---|---|---|
| Proveedor | `proveedores` | id, name, phone, email, city |
| Producto | `productos` | id, name, description, price, stock, providerId |
| Usuario | `usuarios` | id, name, email, role |
| Venta | `ventas` | id, userId, date, total |
| DetalleVenta | `detalle_ventas` | id, saleId, productId, quantity, price |

### Relaciones

- **Proveedor → Productos** (1:N). No se puede eliminar un proveedor con productos.
- **Usuario → Ventas** (1:N). No se puede eliminar un usuario con ventas.
- **Venta → DetalleVenta** (1:N). Al eliminar una venta se eliminan sus detalles.
- **Producto → DetalleVenta** (1:N). No se puede eliminar un producto que ya se vendió.

## Roles de usuario

| Rol | Descripción | ¿Puede vender? |
|---|---|---|
| administrador | Acceso total al sistema | Sí |
| supervisor | Supervisa la caja, registra y corrige ventas | Sí |
| cajero | Registra ventas en el punto de pago (rol por defecto) | Sí |
| bodeguero | Gestiona inventario y mercancía de proveedores | No |
| auditor | Consulta ventas e inventario con fines de control | No |

## Validaciones y reglas de negocio

**Productos**
- El precio debe ser mayor a 0.
- El stock no puede ser negativo.
- El proveedor asociado debe existir.

**Usuarios y proveedores**
- El correo es único y se guarda en minúsculas.
- El rol debe ser uno de los roles definidos.
- El sistema no permite eliminar ni quitarle el rol al único administrador.

**Ventas**
- El **total se calcula automáticamente** sumando `cantidad × precio` de cada detalle. Si el cliente envía un total, se ignora.
- El precio de cada detalle se toma del producto en el momento de la venta, así el historial no cambia si luego se modifica el precio.
- Se valida que haya stock suficiente y se descuenta del inventario.
- Solo los usuarios con rol administrador, supervisor o cajero pueden registrar ventas.
- La fecha no puede ser futura. Si no se envía, se usa la fecha actual.
- Si un producto llega repetido en la misma venta se suman las cantidades.
- Todas las operaciones de venta usan transacciones: si algo falla no se guarda nada y el stock queda intacto.
- Al editar o eliminar una venta o un detalle se devuelve el stock y se recalcula el total.
- Una venta no puede quedar sin productos.

## Formato de respuesta

Respuesta exitosa:

```json
{
  "ok": true,
  "mensaje": "Productos obtenidos correctamente",
  "total": 1,
  "datos": [ ... ]
}
```

Respuesta con error:

```json
{
  "ok": false,
  "mensaje": "Los datos enviados no son válidos",
  "errores": [
    { "campo": "price", "mensaje": "El precio debe ser mayor a 0" }
  ]
}
```

| Código | Significado |
|---|---|
| 200 | Consulta, actualización o eliminación correcta |
| 201 | Registro creado |
| 400 | Datos inválidos |
| 403 | El usuario no tiene permiso para vender |
| 404 | Registro o ruta no encontrados |
| 409 | Conflicto (correo repetido, stock insuficiente, registro con relaciones) |
| 500 | Error interno del servidor |

## Endpoints

Cada entidad tiene su CRUD completo.

| Método | Proveedores | Productos | Usuarios | Ventas | Detalle de ventas |
|---|---|---|---|---|---|
| GET | `/api/proveedores` | `/api/productos` | `/api/usuarios` | `/api/ventas` | `/api/detalle-ventas` |
| GET | `/api/proveedores/:id` | `/api/productos/:id` | `/api/usuarios/:id` | `/api/ventas/:id` | `/api/detalle-ventas/:id` |
| POST | `/api/proveedores` | `/api/productos` | `/api/usuarios` | `/api/ventas` | `/api/detalle-ventas` |
| PUT | `/api/proveedores/:id` | `/api/productos/:id` | `/api/usuarios/:id` | `/api/ventas/:id` | `/api/detalle-ventas/:id` |
| DELETE | `/api/proveedores/:id` | `/api/productos/:id` | `/api/usuarios/:id` | `/api/ventas/:id` | `/api/detalle-ventas/:id` |

Adicional: `GET /api/usuarios/roles` lista los roles disponibles.

### Filtros disponibles

| Endpoint | Parámetros |
|---|---|
| `GET /api/proveedores` | `nombre`, `ciudad` |
| `GET /api/productos` | `nombre`, `proveedorId`, `stockMaximo` |
| `GET /api/usuarios` | `nombre`, `rol` |
| `GET /api/ventas` | `usuarioId`, `desde`, `hasta` (AAAA-MM-DD) |
| `GET /api/detalle-ventas` | `ventaId`, `productoId` |

## Ejemplos de uso

Los ejemplos siguen el orden lógico de uso: primero proveedor, luego producto y usuario, y por último la venta.

### Crear un proveedor

`POST /api/proveedores`

```json
{
  "name": "Alpina S.A.",
  "phone": "6068812345",
  "email": "ventas@alpina.com.co",
  "city": "Manizales"
}
```

### Crear un producto

`POST /api/productos`

```json
{
  "name": "Leche entera 1L",
  "description": "Leche entera pasteurizada en bolsa",
  "price": 4200,
  "stock": 80,
  "providerId": 1
}
```

### Consultar productos con poco inventario

`GET /api/productos?stockMaximo=10`

### Crear un usuario

`POST /api/usuarios`

```json
{
  "name": "Laura Gómez",
  "email": "laura.gomez@marketsoft.com",
  "role": "cajero"
}
```

### Registrar una venta

`POST /api/ventas`

```json
{
  "userId": 1,
  "detalles": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

Respuesta (`201`):

```json
{
  "ok": true,
  "mensaje": "Venta registrada correctamente",
  "datos": {
    "id": 1,
    "userId": 1,
    "date": "2026-09-26T15:30:00.000Z",
    "total": 11150,
    "usuario": { "id": 1, "name": "Laura Gómez", "email": "laura.gomez@marketsoft.com", "role": "cajero" },
    "detalles": [
      { "id": 1, "productId": 1, "quantity": 2, "price": 4200, "producto": { "id": 1, "name": "Leche entera 1L" } },
      { "id": 2, "productId": 2, "quantity": 1, "price": 2750, "producto": { "id": 2, "name": "Arroz Diana 500g" } }
    ]
  }
}
```

### Venta con stock insuficiente

Respuesta (`409`):

```json
{
  "ok": false,
  "mensaje": "Stock insuficiente para uno o más productos",
  "errores": [
    { "productId": 1, "producto": "Leche entera 1L", "disponible": 3, "solicitado": 5 }
  ]
}
```

### Reemplazar los productos de una venta

`PUT /api/ventas/1`

```json
{
  "detalles": [
    { "productId": 1, "quantity": 3 }
  ]
}
```

### Agregar un producto a una venta existente

`POST /api/detalle-ventas`

```json
{
  "saleId": 1,
  "productId": 3,
  "quantity": 2
}
```

### Cambiar la cantidad de un detalle

`PUT /api/detalle-ventas/3`

```json
{
  "quantity": 4
}
```

### Anular una venta

`DELETE /api/ventas/1`. Elimina la venta y devuelve el stock al inventario.
