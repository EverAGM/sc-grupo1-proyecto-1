import { toast } from 'react-toastify';

const API_URL = "http://localhost:3000/api/periodos-contables";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || `Error HTTP: ${response.status}`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
  return data;
};

export const obtenerPeriodos = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await handleResponse(response);
    return data.data; 
  } catch (error) {
    console.error('Error al obtener periodos:', error);
    return [];
  }
};

export const crearPeriodo = async (datosPeriodo) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosPeriodo),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error al crear periodo:', error);
    throw error;
  }
};

export const actualizarPeriodo = async (id, datosPeriodo) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosPeriodo),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error al actualizar periodo:', error);
    throw error;
  }
};

export const eliminarPeriodo = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error al eliminar periodo:', error);
    throw error;
  }
};