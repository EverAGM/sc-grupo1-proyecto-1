const API_URL = "http://localhost:3000/api/cuentas-contables";

export const obtenerCuentas = async () => {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.data;
};

export const obtenerCuentaPorId = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  const data = await res.json();
  return data.data;
};
