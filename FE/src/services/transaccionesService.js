const API_URL = "http://localhost:3000/api/transacciones-contables"; 

export const obtenerTransacciones = async () => {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.data;
};

export const obtenerTransaccionPorId = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  const data = await res.json();
  return data.data;
};

export const crearTransaccion = async (transaccion) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaccion),
  });
  const data = await res.json();
  return data;
};
