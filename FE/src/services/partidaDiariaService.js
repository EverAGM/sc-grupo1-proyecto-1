const API_URL = "http://localhost:3000/api/partidas-diarias";

export const obtenerPartidas = async () => {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.data;
};

export const obtenerPartidaPorId = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  const data = await res.json();
  return data.data;
};

export const crearPartida = async (partida) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partida),
  });
  const data = await res.json();
  return data.data;
};

export const obtenerPartidasPorPeriodo = async (id_periodo) => {
  const res = await fetch(`${API_URL}/periodo/${id_periodo}`);
  const data = await res.json();
  return data.data;
};

export const obtenerPartidasPorFechas = async (fechaInicio, fechaFin) => {
  const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  const res = await fetch(`${API_URL}/fechas?${params.toString()}`);
  const data = await res.json();
  return data.data;
};
