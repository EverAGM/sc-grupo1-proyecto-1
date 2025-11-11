import { useState, useEffect } from "react";
import { exportarExcel, exportarHTML, obtenerEstadoReportes } from "../services/reportesService";
import "./ReportesPage.css";

export default function ReportesPage() {
  const [reporteData, setReporteData] = useState({
    disponible: true,
    ultimaActualizacion: new Date().toLocaleDateString()
  });
  const [loading, setLoading] = useState({
    excel: false,
    html: false
  });

  useEffect(() => {
    cargarEstadoReportes();
  }, []);

  const cargarEstadoReportes = async () => {
    try {
      const estado = await obtenerEstadoReportes();
      setReporteData(estado);
    } catch (error) {
      console.error('Error al cargar estado de reportes:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(prev => ({ ...prev, excel: true }));
      
      const resultado = await exportarExcel();
      
      if (resultado.success) {
        // En un entorno real, aquí descargaríamos el archivo
        alert(`✅ ${resultado.message}\nArchivo: ${resultado.data.filename}`);
      }
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('❌ Error al generar el archivo Excel');
    } finally {
      setLoading(prev => ({ ...prev, excel: false }));
    }
  };

  const handleExportHTML = async () => {
    try {
      setLoading(prev => ({ ...prev, html: true }));
      
      const resultado = await exportarHTML();
      
      if (resultado.success) {
        // En un entorno real, aquí descargaríamos el archivo
        alert(`✅ ${resultado.message}\nArchivo: ${resultado.data.filename}`);
      }
    } catch (error) {
      console.error('Error al exportar HTML:', error);
      alert('❌ Error al generar el archivo HTML');
    } finally {
      setLoading(prev => ({ ...prev, html: false }));
    }
  };

  return (
    <div className="reportes-page">
      <h1>Exportación de Reportes</h1>
      
      {/* Sección Export */}
      <div className="export-card">
        <div className="export-header">
          <h2>Export</h2>
          <div className="export-info">
            <span className="status">
              {reporteData.disponible ? '🟢 Reportes disponibles' : '🔴 Reportes no disponibles'}
            </span>
            <span className="last-update">
              Última actualización: {reporteData.ultimaActualizacion}
            </span>
          </div>
        </div>
        
        <div className="export-content">
          <div className="export-description">
            <p>Descarga los reportes contables en diferentes formatos:</p>
            <ul>
              <li><strong>Excel:</strong> Perfecto para análisis y manipulación de datos</li>
              <li><strong>HTML:</strong> Ideal para visualización e impresión</li>
            </ul>
          </div>
          
          <div className="export-buttons">
            <button 
              className="export-btn excel-btn"
              onClick={handleExportExcel}
              disabled={!reporteData.disponible || loading.excel}
            >
              <span className="btn-icon">{loading.excel ? '⏳' : '📊'}</span>
              {loading.excel ? 'Generando...' : 'Exportar Excel'}
            </button>
            <button 
              className="export-btn html-btn"
              onClick={handleExportHTML}
              disabled={!reporteData.disponible || loading.html}
            >
              <span className="btn-icon">{loading.html ? '⏳' : '🌐'}</span>
              {loading.html ? 'Generando...' : 'Exportar HTML'}
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="info-card">
        <h3>Información de los reportes</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Período:</label>
            <span>Año fiscal actual</span>
          </div>
          <div className="info-item">
            <label>Incluye:</label>
            <span>Balance General, Estado de Resultados</span>
          </div>
          <div className="info-item">
            <label>Formato Excel:</label>
            <span>.xlsx compatible con Microsoft Excel</span>
          </div>
          <div className="info-item">
            <label>Formato HTML:</label>
            <span>.html optimizado para impresión</span>
          </div>
        </div>
      </div>
    </div>
  );
}