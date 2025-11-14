const API_URL = "http://localhost:3000/api/cuentas-contables";

async function handleResponse(res, defaultErrorMessage) {
  let data = null;

  try {
    data = await res.json();
  } catch {

  }

  if (!res.ok) {
    const msg = data?.message || defaultErrorMessage || "Error en la petición";
    const error = new Error(msg);

    if (
      data?.code === "23001" ||
      (typeof msg === "string" &&
        msg.toLowerCase().includes("hijas"))
    ) {
      error.isFK = true;
    }

    if (
      typeof msg === "string" &&
      msg.toLowerCase().includes("ya existe una cuenta contable")
    ) {
      error.isDuplicate = true;
    }

    throw error;
  }

  return data;
}

export const obtenerCuentas = async () => {
  const data = await handleResponse(
    await fetch(API_URL),
    "Error al obtener las cuentas contables"
  );
  return data?.data || [];
};

export const obtenerCuentaPorId = async (id) => {
  const data = await handleResponse(
    await fetch(`${API_URL}/${id}`),
    "Error al obtener la cuenta contable"
  );
  return data?.data;
};

export const crearCuentaContable = async (payload) => {
  const data = await handleResponse(
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Error al crear la cuenta contable"
  );
  return data?.data;
};

export const actualizarCuentaContable = async (id, payload) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(res);
  return data.data; 
};

export const eliminarCuentaContable = async (id) => {
  const data = await handleResponse(
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    }),
    "Error al eliminar la cuenta contable"
  );
  return data?.data;
};
