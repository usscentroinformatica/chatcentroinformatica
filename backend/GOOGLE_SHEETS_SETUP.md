# 🔧 GUÍA DE CONFIGURACIÓN - SERVICE ACCOUNT PARA GOOGLE SHEETS

## Pasos para habilitar escritura automática en Google Sheets:

### 1. Crear Service Account
- Ve a: https://console.cloud.google.com
- Crea proyecto nuevo o selecciona existente
- APIs & Services → Credentials → Create Credentials → Service Account
- Nombre: "chatbot-uss-sheets"
- Role: Editor o Owner

### 2. Generar clave JSON
- Service Account creado → pestaña "Keys"
- Add Key → Create new key → JSON
- Descargar el archivo JSON

### 3. Habilitar Google Sheets API
- APIs & Services → Library
- Buscar "Google Sheets API" → Enable

### 4. Compartir hoja de cálculo
- Abrir el archivo JSON descargado
- Copiar el email de "client_email"
- Ir a tu Google Sheet
- Compartir → Pegar email → Permisos de Editor

### 5. Configurar variables de entorno (.env)
Reemplazar en tu archivo .env estos valores del archivo JSON:

```
GOOGLE_PROJECT_ID=encontrar_en_json
GOOGLE_PRIVATE_KEY_ID=encontrar_en_json  
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ncopiar_de_json\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_EMAIL=encontrar_en_json
GOOGLE_CLIENT_ID=encontrar_en_json
```

### 6. Reiniciar servidor
Una vez configurado, reinicia el servidor con: node server.js

### 🚨 IMPORTANTE:
- El archivo JSON contiene credenciales sensibles - NO lo subas a Git
- Agrega "*.json" a tu .gitignore
- Mantén las credenciales seguras

### ✅ Verificación exitosa:
Deberías ver: "✅ Google Sheets configurado correctamente con Service Account"