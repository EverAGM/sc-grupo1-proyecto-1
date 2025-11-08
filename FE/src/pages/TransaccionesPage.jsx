import { useEffect, useState } from "react";
import { obtenerTransacciones, crearTransaccion } from "../services/transaccionesService";

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [formData, setFormData] = useState({
    cuenta_id: "",
    monto: "",
    tipo_transaccion: "DEBE",
    partida_diaria_id: "",
  });

  const cargarTransacciones = async () => {
    const data = await obtenerTransacciones();
    setTransacciones(data);
  };

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await crearTransaccion(formData);
    await cargarTransacciones();
    setFormData({ cuenta_id: "", monto: "", tipo_transaccion: "DEBE", partida_diaria_id: "" });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transacciones Contables</h1>

      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input
          type="number"
          placeholder="Cuenta ID"
          value={formData.cuenta_id}
          onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Monto"
          value={formData.monto}
          onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <select
          value={formData.tipo_transaccion}
          onChange={(e) => setFormData({ ...formData, tipo_transaccion: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="DEBE">DEBE</option>
          <option value="HABER">HABER</option>
        </select>
        <input
          type="number"
          placeholder="Partida Diaria ID"
          value={formData.partida_diaria_id}
          onChange={(e) => setFormData({ ...formData, partida_diaria_id: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Crear Transacción
        </button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Cuenta ID</th>
            <th className="border p-2">Monto</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Partida ID</th>
          </tr>
        </thead>
        <tbody>
          {transacciones.map((t) => (
            <tr key={t.id_transaccion}>
              <td className="border p-2">{t.id_transaccion}</td>
              <td className="border p-2">{t.cuenta_id}</td>
              <td className="border p-2">{t.monto}</td>
              <td className="border p-2">{t.tipo_transaccion}</td>
              <td className="border p-2">{t.partida_diaria_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
