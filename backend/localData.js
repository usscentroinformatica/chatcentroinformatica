// Sistema alternativo para guardar datos cuando Google Sheets API falla
// Usa un archivo CSV local como backup principal
const fs = require('fs');
const path = require('path');

class LocalDataManager {
  constructor() {
    this.csvFile = path.join(__dirname, 'estudiantes_data.csv');
    this.initCSV();
  }

  // Inicializar archivo CSV con encabezados
  initCSV() {
    if (!fs.existsSync(this.csvFile)) {
      const headers = 'Fecha_Registro,Nombre_Completo,Ciclo_Egreso,Ultimo_Curso_Aprobado,Curso_Corresponde,Correo_Institucional,Estado_Inscripcion\n';
      fs.writeFileSync(this.csvFile, headers, 'utf8');
      console.log('📝 Archivo CSV creado:', this.csvFile);
    }
  }

  // Guardar datos del estudiante en CSV
  async saveStudentData(studentData) {
    try {
      const csvRow = [
        new Date().toLocaleString('es-PE'),
        this.escapeCsv(studentData.nombre || 'No proporcionado'),
        this.escapeCsv(studentData.ciclo || 'No proporcionado'),
        this.escapeCsv(studentData.ultimoCurso || 'No proporcionado'),
        this.escapeCsv(studentData.cursoCorresponde || 'Por determinar'),
        this.escapeCsv(studentData.correo || 'No proporcionado'),
        'Datos_Recopilados'
      ].join(',') + '\n';

      fs.appendFileSync(this.csvFile, csvRow, 'utf8');
      
      console.log('✅ Datos guardados en CSV para:', studentData.nombre);
      
      // También crear un log JSON más detallado
      this.saveToJsonLog(studentData);
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando en CSV:', error.message);
      return false;
    }
  }

  // Escape para valores CSV
  escapeCsv(value) {
    if (!value) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Guardar log JSON detallado
  saveToJsonLog(studentData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      fecha_legible: new Date().toLocaleString('es-PE'),
      ...studentData,
      source: 'chatbot_uss'
    };
    
    const logFile = path.join(__dirname, 'estudiantes_log.json');
    let logs = [];
    
    // Leer logs existentes
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(content);
      } catch (error) {
        logs = [];
      }
    }
    
    // Agregar nuevo log
    logs.push(logEntry);
    
    // Guardar logs actualizados
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
  }

  // Obtener todos los estudiantes
  async getStudentData() {
    try {
      if (!fs.existsSync(this.csvFile)) return [];

      const content = fs.readFileSync(this.csvFile, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',');
      const students = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const student = {};
        
        headers.forEach((header, index) => {
          student[header] = values[index] || '';
        });
        
        students.push(student);
      }

      return students;
    } catch (error) {
      console.error('❌ Error leyendo CSV:', error.message);
      return [];
    }
  }

  // Parser simple para líneas CSV
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Obtener estadísticas
  async getStats() {
    try {
      const students = await this.getStudentData();
      return {
        total: students.length,
        por_ciclo: this.countByCycle(students),
        por_curso: this.countByCourse(students)
      };
    } catch (error) {
      return { total: 0, error: error.message };
    }
  }

  countByCycle(students) {
    const counts = {};
    students.forEach(student => {
      const ciclo = student.Ciclo_Egreso || 'Sin especificar';
      counts[ciclo] = (counts[ciclo] || 0) + 1;
    });
    return counts;
  }

  countByCourse(students) {
    const counts = {};
    students.forEach(student => {
      const curso = student.Curso_Corresponde || 'Sin especificar';
      counts[curso] = (counts[curso] || 0) + 1;
    });
    return counts;
  }
}

module.exports = LocalDataManager;