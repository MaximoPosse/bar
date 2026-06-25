# Bar🍸

Sistema de gestión para bares y restaurantes. Permite administrar productos, carrito de compras, autenticación de usuarios (incluyendo reconocimiento facial), reservas y promociones.

---

## Estructura del Proyecto

```
bar-main/
├── Client/                     # Frontend (React + Vite + Tailwind)
│   ├── public/                 # Archivos estáticos e imágenes
│   ├── src/
│   │   ├── assets/             # Imágenes de bebidas y logo
│   │   ├── Components/         # Componentes React
│   │   │   ├── Admin/          # Panel de administración
│   │   │   ├── Bebidas/        # Tarjetas de bebidas
│   │   │   ├── Cart/           # Carrito de compras
│   │   │   ├── Login/          # Inicio de sesión
│   │   │   ├── Promotions/     # Carrusel de promociones
│   │   │   ├── Reservation/    # Formulario de reservas
│   │   │   └── ui/             # Componentes reutilizables
│   │   ├── Context/            # Contextos (Auth, Cart)
│   │   └── lib/                # Utilidades
│   ├── package.json
│   └── vite.config.js
│
└── Server/                     # Backend (Express + SQLite)
    ├── src/
    │   ├── Controller/         # Lógica de negocio
    │   ├── DataBase/           # Base de datos SQLite
    │   ├── Routers/            # Rutas de la API
    │   └── Utils/              # Utilidades (Email, Hash, etc.)
    ├── .env                    # Variables de entorno
    ├── app.js                  # Punto de entrada del servidor
    └── package.json
```

---

## Prerrequisitos

- [Node.js](https://nodejs.org/) v16 o superior
- npm (viene con Node.js)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd bar-main
```

### 2. Instalar dependencias del servidor

```bash
cd Server
npm install
```

### 3. Instalar dependencias del cliente

```bash
cd ../Client
npm install
```

---

## Ejecución

### Iniciar el servidor (Backend)

```bash
cd Server
npm run server     # Con nodemon (reinicio automático)
# o
npm start          # Con node
```

El servidor correrá en `http://localhost:3000`

### Iniciar el cliente (Frontend)

En otra terminal:

```bash
cd Client
npm run dev
```

El cliente correrá en `http://localhost:5173`

---

## Comandos Disponibles

### Servidor (`cd Server`)

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `npm start`       | Inicia el servidor con Node.js       |
| `npm run server`  | Inicia el servidor con nodemon       |

### Cliente (`cd Client`)

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Inicia entorno de desarrollo (Vite)  |
| `npm run build`   | Genera build de producción           |
| `npm run preview` | Previsualiza el build de producción  |
| `npm run lint`    | Ejecuta ESLint                       |

---

## Tecnologías Utilizadas

### Frontend
- **React 19** + **Vite** - Framework y bundler
- **Tailwind CSS** - Estilos
- **React Router DOM** - Navegación
- **Axios** - Peticiones HTTP
- **Lucide React** - Íconos
- **face-api.js** - Reconocimiento facial

### Backend
- **Node.js + Express** - Servidor
- **SQLite3** - Base de datos
- **bcrypt** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **nodemailer** - Envío de correos
- **multer** - Carga de archivos

---

## Variables de Entorno

El archivo `Server/.env` contiene:

```
PORT=3000
EMAIL_USER=correo@ejemplo.com
EMAIL_PASS=contraseña_de_aplicacion
```
