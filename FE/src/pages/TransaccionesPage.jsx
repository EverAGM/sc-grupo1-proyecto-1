import { useEffect, useState } from "react";
import { obtenerTransacciones, crearTransaccion } from "../services/transaccionesService";
import "./TransaccionesPage.css";

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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString; 
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await crearTransaccion(formData);
    await cargarTransacciones();
    setFormData({ cuenta_id: "", monto: "", tipo_transaccion: "DEBE", partida_diaria_id: "" });
  };

  return (
    <div className="p-6">
      <h1 className="titulo">Transacciones Contables</h1>
      <div className="table-wrapper">
        <table className="table-trans">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha de Creacion</th>
            <th>Periodo</th>
            <th>Cuenta</th>
            <th>Monto</th>
            <th>Tipo</th>
            <th>Partida</th>
          </tr>
        </thead>
        <tbody>
          {transacciones.map((t) => (
            <tr key={t.id_transaccion}>
              <td>{t.id_transaccion}</td>
              <td>{formatDate(t.fecha_creacion)}</td>
              <td>
                {t.periodo_fecha_inicio || t.periodo_fecha_fin
                  ? `${formatDate(t.periodo_fecha_inicio)} - ${formatDate(t.periodo_fecha_fin)}`
                  : ""}
              </td>
              <td>{t.cuenta_id}</td>
              <td>{t.monto}</td>
              <td>{t.tipo_transaccion}</td>
              <td>{t.partida_diaria_id}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="create-btn-inline">
        <button onClick={openModal} className="bg-blue-600 text-white px-4 py-2 rounded">
          Agregar Transacción
        </button>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <strong>Crear Transacción</strong>
              <button className="modal-close" onClick={closeModal} aria-label="Cerrar">×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => { e.preventDefault(); await handleSubmit(e); closeModal(); }}>
                <input
                  type="number"
                  placeholder="Cuenta ID"
                  value={formData.cuenta_id}
                  onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Monto"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  required
                />
                <select
                  value={formData.tipo_transaccion}
                  onChange={(e) => setFormData({ ...formData, tipo_transaccion: e.target.value })}
                >
                  <option value="DEBE">DEBE</option>
                  <option value="HABER">HABER</option>
                </select>
                <input
                  type="number"
                  placeholder="Partida Diaria ID"
                  value={formData.partida_diaria_id}
                  onChange={(e) => setFormData({ ...formData, partida_diaria_id: e.target.value })}
                  required
                />
                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded border">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Crear</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
