// Módulo para integrar con Google Sheets API
// Configurado para trabajar con API Key (solo lectura)
const { google } = require('googleapis');
const fs = require('fs');

class GoogleSheetsManager {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = null;
    this.auth = null;
  }

  // Inicializar conexión con Google Sheets usando Service Account
  async initialize() {
    try {
      // Verificar si tenemos las credenciales necesarias
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.log('⚠️ Service Account no configurado - usando solo backup local');
        console.log('💡 Configure GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY para habilitar escritura automática');
        return false;
      }

      if (!process.env.GOOGLE_SHEET_ID) {
        console.log('⚠️ Google Sheet ID no configurado - usando solo backup local');
        return false;
      }

      // Configurar Service Account con credenciales completas
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
      
      // Verificar conexión
      console.log('🔄 Verificando conexión con Service Account...');
      await this.ensureStudentsSheet();
      
      console.log('✅ Google Sheets configurado correctamente con Service Account');
      console.log('📊 Escritura automática HABILITADA');
      
      return true;
    } catch (error) {
      console.error('❌ Error conectando Google Sheets:', error.message);
      console.log('🔄 Verificando si es un problema de permisos...');
      return false;
    }
  }

  // Verificar/crear hoja de estudiantes
  async ensureStudentsSheet() {
    try {
      // Verificar si existe la hoja "Estudiantes"
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const studentsSheet = response.data.sheets.find(sheet => 
        sheet.properties.title === 'Estudiantes'
      );
      
      if (!studentsSheet) {
        // Crear hoja si no existe
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Estudiantes'
                }
              }
            }]
          }
        });
        
        // Agregar encabezados
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Estudiantes!A1:G1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'Fecha_Registro',
              'Nombre_Completo', 
              'Ciclo_Egreso',
              'Ultimo_Curso_Aprobado',
              'Curso_Corresponde',
              'Correo_Institucional',
              'Estado_Inscripcion'
            ]]
          }
        });
        
        console.log('📋 Hoja "Estudiantes" creada con encabezados');
      } else {
        console.log('✅ Hoja "Estudiantes" ya existe');
      }

    } catch (error) {
      console.error('❌ Error verificando/creando hoja:', error.message);
      throw error;
    }
  }

  // Guardar datos del estudiante en Google Sheets
  async saveStudentData(studentData) {
    console.log('🔄 Intentando guardar en Google Sheets:', studentData.nombre);
    
    try {
      if (!this.sheets) {
        console.log('⚠️ Google Sheets no inicializado, guardando solo localmente...');
        this.saveToLocalLog(studentData);
        return false;
      }

      if (!this.spreadsheetId) {
        console.log('⚠️ spreadsheetId no configurado');
        return false;
      }

      console.log('📊 Configuración OK - preparando datos...');

      // Preparar datos para la fila
      const rowData = [
        new Date().toLocaleString('es-PE'),
        studentData.nombre || 'No proporcionado',
        studentData.ciclo || 'No proporcionado', 
        studentData.ultimoCurso || 'No proporcionado',
        studentData.cursoCorresponde || 'Por determinar',
        studentData.correo || 'No proporcionado',
        'Datos_Recopilados'
      ];

      console.log('📝 Datos preparados:', rowData);
      console.log('📍 Enviando a spreadsheet:', this.spreadsheetId);

      // Añadir fila a la hoja
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Estudiantes!A:G',
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      
      console.log('✅ Respuesta de Google Sheets:', response.data.updates);
      console.log('✅ Datos guardados en Google Sheets para:', studentData.nombre);
      return true;

    } catch (error) {
      console.error('❌ Error COMPLETO guardando en Google Sheets:');
      console.error('   Mensaje:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalles:', error.response?.data || 'Sin detalles adicionales');
      
      // Si es error de permisos, dar instrucciones específicas
      if (error.message.includes('permission') || error.message.includes('access') || error.message.includes('forbidden')) {
        console.log('🔑 SOLUCIÓN: Asegúrate de compartir la hoja con el email del Service Account');
        console.log('📧 Email Service Account:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
        console.log('🔗 Tu hoja:', `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`);
      }
      
      if (error.message.includes('not found')) {
        console.log('🔍 PROBLEMA: La hoja no existe o el ID es incorrecto');
        console.log('📍 ID actual:', this.spreadsheetId);
      }
      
      // Fallback: guardar localmente
      this.saveToLocalLog(studentData);
      return false;
    }
  }

  // Backup local en caso de fallo o limitación de API Key
  saveToLocalLog(studentData) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        fecha_registro: new Date().toLocaleString('es-PE'),
        ...studentData
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync('./estudiantes_sheets_log.txt', logLine);
      console.log('💾 Datos guardados en log de Google Sheets como backup');
    } catch (error) {
      console.error('❌ Error guardando backup local:', error.message);
    }
  }

  // Obtener datos de estudiantes (solo lectura)
  async getStudentData() {
    try {
      if (!this.sheets) return [];

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Estudiantes!A:G'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      // Convertir filas a objetos (saltando encabezado)
      const headers = rows[0];
      return rows.slice(1).map(row => {
        const student = {};
        headers.forEach((header, index) => {
          student[header] = row[index] || '';
        });
        return student;
      });

    } catch (error) {
      console.error('❌ Error obteniendo datos de Google Sheets:', error.message);
      return [];
    }
  }
}

module.exports = GoogleSheetsManager;