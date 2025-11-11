// Servicio mock para reportes - Simulará las APIs del backend

const API_URL = "http://localhost:3000/api/reportes"; // URL que usará cuando el backend esté listo

// Datos mock para desarrollo
const mockReporteData = {
  balance: {
    activos: [
      { codigo: "1.1", nombre: "Caja", saldo: 15000 },
      { codigo: "1.2", nombre: "Bancos", saldo: 85000 },
      { codigo: "1.3", nombre: "Cuentas por Cobrar", saldo: 45000 }
    ],
    pasivos: [
      { codigo: "2.1", nombre: "Cuentas por Pagar", saldo: 25000 },
      { codigo: "2.2", nombre: "Préstamos Bancarios", saldo: 50000 }
    ],
    patrimonio: [
      { codigo: "3.1", nombre: "Capital Social", saldo: 70000 }
    ]
  },
  fechaGeneracion: new Date().toISOString(),
  periodo: "2024"
};

export const obtenerEstadoReportes = async () => {
  // TODO: Reemplazar con llamada real al backend
  // return fetch(`${API_URL}/estado`).then(res => res.json());
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        disponible: true,
        ultimaActualizacion: new Date().toLocaleDateString(),
        periodo: "2024"
      });
    }, 500);
  });
};

export const exportarExcel = async () => {
  // TODO: Reemplazar con llamada real al backend
  // return fetch(`${API_URL}/excel`, { method: 'POST' });
  
  // Mock - simular descarga
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock: Generando archivo Excel...', mockReporteData);
      
      // Simular creación de archivo Excel
      const mockExcelData = {
        filename: `balance-general-${new Date().toISOString().split('T')[0]}.xlsx`,
        url: '#', // En el backend real, sería una URL de descarga
        size: '45 KB'
      };
      
      resolve({
        success: true,
        data: mockExcelData,
        message: 'Archivo Excel generado correctamente'
      });
    }, 1000);
  });
};

export const exportarHTML = async () => {
  // TODO: Reemplazar con llamada real al backend
  // return fetch(`${API_URL}/html`, { method: 'POST' });
  
  // Mock - simular descarga
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock: Generando archivo HTML...', mockReporteData);
      
      // Simular creación de archivo HTML
      const mockHTMLData = {
        filename: `balance-general-${new Date().toISOString().split('T')[0]}.html`,
        url: '#', // En el backend real, sería una URL de descarga
        size: '12 KB'
      };
      
      resolve({
        success: true,
        data: mockHTMLData,
        message: 'Archivo HTML generado correctamente'
      });
    }, 800);
  });
};

export const obtenerDatosBalance = async () => {
  // TODO: Reemplazar con llamada real al backend
  // return fetch(`${API_URL}/balance`).then(res => res.json());
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockReporteData
      });
    }, 300);
  });
};

// Función helper para descargar archivos (cuando el backend esté listo)
export const descargarArchivo = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};