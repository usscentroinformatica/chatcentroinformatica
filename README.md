# 🚀 Chatbot USS - Guía de Inicio

## 📁 Estructura del Proyecto

```
chatbot-uss/
├── backend/           # Servidor Node.js + Express
│   ├── server.js     # API del chatbot
│   ├── package.json  # Dependencias del backend
│   └── .env         # Variables de entorno
├── src/              # Frontend React (RAÍZ)
│   ├── App.js       # Componente principal
│   ├── index.js     # Punto de entrada
│   └── ...
├── public/           # Archivos públicos del frontend
├── package.json      # Frontend React en la raíz
└── README.md        # Esta guía
```

## 🛠️ Cómo Ejecutar

### 1. **Instalar Dependencias**

#### Frontend (desde la raíz):
```bash
npm install
```

#### Backend:
```bash
cd backend
npm install
```

### 2. **Ejecutar en Desarrollo**

#### Terminal 1 - Backend:
```bash
cd backend
node server.js
```
*El backend estará en: http://localhost:5000*

#### Terminal 2 - Frontend (desde la raíz):
```bash
npm start
```
*El frontend estará en: http://localhost:3000*

### 3. **Scripts Útiles**

#### Frontend (ejecutar desde la raíz):
- `npm start` - Desarrollo
- `npm run build` - Compilar para producción
- `npm test` - Ejecutar pruebas

#### Backend (ejecutar desde /backend):
- `node server.js` - Iniciar servidor

## 🌐 Despliegue en Vercel

Tu proyecto está configurado para Vercel:
- Frontend: Se despliega desde la raíz automáticamente
- Backend: Se ejecuta como función serverless en `/api`

## 📱 Configuración

El frontend se conecta automáticamente al backend:
- **Desarrollo**: http://localhost:5000/api/chat
- **Producción**: /api/chat (Vercel)

## 🔧 Variables de Entorno

En `backend/.env`:
```
GEMINI_API_KEY=tu_api_key_aquí
PORT=5000
```

## ✅ Estado Actual

- ✅ Frontend en la raíz del proyecto
- ✅ Backend en carpeta separada `/backend`
- ✅ Configuración lista para desarrollo
- ✅ Lista para desplegar en Vercel

¡Tu proyecto está listo para funcionar! 🎉