import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3000/api/facturacion-electronica';

export const obtenerFacturas = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.message || 'Error al obtener facturas');
    }
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    toast.error('Error al cargar las facturas electrónicas');
    throw error;
  }
};

export const crearFactura = async (facturaData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facturaData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Factura electrónica creada exitosamente');
      return data.data;
    } else {
      throw new Error(data.message || 'Error al crear factura');
    }
  } catch (error) {
    console.error('Error creando factura:', error);
    
    if (error.message.includes('FechaEmisionFueraDePeriodo')) {
      toast.error(error.message);
    } else if (error.message.includes('PeriodoContableNotFound')) {
      toast.error('El período contable seleccionado no existe');
    } else if (error.message.includes('total no coincide')) {
      toast.error('El total no coincide con la suma de subtotal e impuestos');
    } else {
      toast.error(error.message || 'Error al crear la factura electrónica');
    }
    throw error;
  }
};

export const obtenerFacturaPorId = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Factura no encontrada');
    }
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    toast.error('Error al cargar la factura electrónica');
    throw error;
  }
};

export const actualizarFactura = async (id, facturaData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facturaData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Factura electrónica actualizada exitosamente');
      return data.data;
    } else {
      throw new Error(data.message || 'Error al actualizar factura');
    }
  } catch (error) {
    console.error('Error actualizando factura:', error);
    
    if (error.message.includes('FechaEmisionFueraDePeriodo')) {
      toast.error(error.message);
    } else if (error.message.includes('PeriodoContableNotFound')) {
      toast.error('El período contable seleccionado no existe');
    } else if (error.message.includes('total no coincide')) {
      toast.error('El total no coincide con la suma de subtotal e impuestos');
    } else {
      toast.error(error.message || 'Error al actualizar la factura electrónica');
    }
    throw error;
  }
};

export const eliminarFactura = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Factura electrónica eliminada exitosamente');
      return true;
    } else {
      throw new Error(data.message || 'Error al eliminar factura');
    }
  } catch (error) {
    console.error('Error eliminando factura:', error);
    toast.error(error.message || 'Error al eliminar la factura electrónica');
    throw error;
  }
};

export const obtenerFacturasPorPeriodo = async (idPeriodo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/periodo/${idPeriodo}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.message || 'Error al obtener facturas del período');
    }
  } catch (error) {
    console.error('Error obteniendo facturas por período:', error);
    toast.error('Error al cargar las facturas del período seleccionado');
    throw error;
  }
};

export const formatearMoneda = (monto) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(monto || 0);
};

export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const ESTADOS_FACTURA = [
  { value: 'BORRADOR', label: 'Borrador', color: '#gray' },
  { value: 'ENVIADA', label: 'Enviada', color: '#blue' },
  { value: 'ACEPTADA', label: 'Aceptada', color: '#green' },
  { value: 'RECHAZADA', label: 'Rechazada', color: '#red' },
  { value: 'ANULADA', label: 'Anulada', color: '#orange' }
];

export const obtenerColorEstado = (estado) => {
  const estadoObj = ESTADOS_FACTURA.find(e => e.value === estado);
  return estadoObj ? estadoObj.color : '#gray';
};