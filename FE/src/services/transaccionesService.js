import { toast } from 'react-toastify';

const API_URL = "http://localhost:3000/api/transacciones-contables";

const handleJsonResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || `Error HTTP: ${response.status}`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
  return data;
};

export const obtenerTransacciones = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await handleJsonResponse(res);
    return data.data;
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return [];
  }
};

export const crearTransaccion = async (transaccion) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaccion),
    });
    return await handleJsonResponse(res);
  } catch (error) {
    console.error('Error al crear transacción:', error);
    throw error;
  }
};

