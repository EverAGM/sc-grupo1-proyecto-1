import { useEffect, useState, useRef } from "react";
import {
  obtenerTransacciones,
  crearTransaccion,
} from "../services/transaccionesService";
import { obtenerCuentas } from "../services/cuentasService";
import { crearPartida, obtenerPartidaPorId } from "../services/partidaDiariaService";
import { obtenerPeriodos } from "../services/periodosService";
import "./TransaccionesPage.css";
import { toast } from 'react-toastify';

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [partidasCache, setPartidasCache] = useState({});
  const partidasFetchingRef = useRef(new Set());

  const [showModal, setShowModal] = useState(false);

  const [partida, setPartida] = useState({
    concepto: "",
    id_periodo: "",
    fecha_creacion: new Date().toISOString().split("T")[0],
  });

  // Estado de transacciones temporales (aún no guardadas)
  const [transTemp, setTransTemp] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formTrans, setFormTrans] = useState({
    cuenta_id: "",
    monto: "",
    tipo_transaccion: "DEBE",
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

  const formatMonto = (m) => {
    if (m === null || m === undefined || m === "") return "0.00";
    const n = Number(m);
    if (Number.isNaN(n)) return m;
    return n.toFixed(2);
  };

  useEffect(() => {
    cargarTransacciones();
    const cargarCuentas = async () => {
      const list = await obtenerCuentas();
      setCuentas(list || []);
    };
    const cargarPeriodos = async () => {
      const p = await obtenerPeriodos();
      setPeriodos(p || []);
    };
    cargarCuentas();
    cargarPeriodos();
  }, []);

  const openModal = () => {
    setPartida({
      concepto: "",
      id_periodo: "",
      fecha_creacion: new Date().toISOString().split("T")[0],
    });
    setTransTemp([]);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const agregarTransaccion = () => {
    if (!formTrans.cuenta_id || !formTrans.monto) return;
    setTransTemp([...transTemp, formTrans]);
    setFormTrans({ cuenta_id: "", monto: "", tipo_transaccion: "DEBE" });
  };

  const eliminarTrans = (index) => {
    setTransTemp(transTemp.filter((_, i) => i !== index));
  };

  const getCuentaNombre = (id) => {
    if (!cuentas || cuentas.length === 0) return id;
    const c = cuentas.find((x) => String(x.id_cuenta) === String(id));
    return c ? `${c.codigo} - ${c.nombre}` : id;
  };
  useEffect(() => {
    if (!transacciones || transacciones.length === 0) return;
    const newEntries = {};
    for (const t of transacciones) {
      if (t.partida_diaria_id && t.partida_concepto) {
        newEntries[t.partida_diaria_id] = t.partida_concepto;
      }
    }
    if (Object.keys(newEntries).length > 0) {
      setPartidasCache((prev) => ({ ...prev, ...newEntries }));
    }
  }, [transacciones]);

  const fetchAndCachePartida = async (id) => {
    if (!id) return null;
    const sid = String(id);
    if (partidasFetchingRef.current.has(sid)) return null;
    partidasFetchingRef.current.add(sid);
    try {
      const p = await obtenerPartidaPorId(id);
      if (p && p.concepto) {
        setPartidasCache((prev) => ({ ...prev, [sid]: p.concepto }));
        return p.concepto;
      }
      return null;
    } catch (error) {
      console.debug("fetchAndCachePartida error", error);
      return null;
    } finally {
      partidasFetchingRef.current.delete(sid);
    }
  };

  const getConceptoPartida = (id) => {
    if (!id) return "";
    const sid = String(id);
    if (partidasCache && partidasCache[sid]) return partidasCache[sid];
    fetchAndCachePartida(id);
    return `#${sid}`;
  };


  const guardarPartidaCompleta = async () => {
    if (!partida.concepto || !partida.id_periodo) {
      toast.warn("Debe ingresar concepto y periodo");
      return;
    }

    try {
      if (transTemp.length === 0) {
        toast.warn("Debe agregar al menos una transacción antes de guardar la partida");
        return;
      }
      setIsSaving(true);
      const nuevaPartida = await crearPartida(partida);

      if (nuevaPartida?.id_partida_diaria) {
        for (const t of transTemp) {
          await crearTransaccion({
            ...t,
            partida_diaria_id: nuevaPartida.id_partida_diaria,
          });
        }
        toast.success("Partida y transacciones guardadas correctamente");
        closeModal();
        await cargarTransacciones();
      }
    } catch (err) {
      console.error(err);
      const msg = err?.message || 'Ocurrió un error al guardar la partida';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="titulo">Transacciones Contables</h1>
      <div className="table-wrapper">
        <table className="table-trans">
          <thead>
            <tr>
              <th>Fecha de Creación</th>
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
                <td>{formatDate(t.fecha_creacion)}</td>
                <td>
                  {t.periodo_fecha_inicio || t.periodo_fecha_fin
                    ? `${formatDate(t.periodo_fecha_inicio)} - ${formatDate(
                        t.periodo_fecha_fin
                      )}`
                    : ""}
                </td>
                <td>{getCuentaNombre(t.cuenta_id)}</td>
                <td>{formatMonto(t.monto)}</td>
                <td>{t.tipo_transaccion}</td>
                <td>{getConceptoPartida(t.partida_diaria_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="create-btn-inline">
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear Nueva Partida
        </button>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <strong>Nueva Partida Diaria</strong>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="form-transaccion"
              >
                <div className="form-group">
                  <label>Fecha de Creación</label>
                  <input type="date" value={partida.fecha_creacion} disabled />
                </div>

                <div className="form-group">
                  <label>Concepto</label>
                  <input
                    type="text"
                    placeholder="Concepto de la partida"
                    value={partida.concepto}
                    onChange={(e) =>
                      setPartida({ ...partida, concepto: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Periodo</label>
                  <select
                    value={partida.id_periodo}
                    onChange={(e) =>
                      setPartida({ ...partida, id_periodo: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  >
                    <option value="">Seleccione periodo</option>
                    {periodos.map((p) => (
                      <option key={p.id_periodo} value={p.id_periodo}>
                        {p.id_periodo} - {formatDate(p.fecha_inicio)} to {formatDate(p.fecha_fin)}
                      </option>
                    ))}
                  </select>
                </div>
              </form>

              <hr className="my-3" />
              <h3>Transacciones de esta partida</h3>
              <div className="form-transaccion-inline">
                <select
                  className="select-cuenta"
                  value={formTrans.cuenta_id}
                  onChange={(e) =>
                    setFormTrans({ ...formTrans, cuenta_id: e.target.value })
                  }
                  disabled={isSaving}
                >
                  <option value="">Seleccione cuenta</option>
                  {cuentas.map((c) => (
                    <option key={c.id_cuenta} value={c.id_cuenta}>
                      {c.codigo} - {c.nombre}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Monto"
                  value={formTrans.monto}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setFormTrans({ ...formTrans, monto: "" });
                      return;
                    }
                    const normalized = val.replace(/,/g, ".");
                    if (/^\d+(?:\.\d{0,2})?$/.test(normalized)) {
                      setFormTrans({ ...formTrans, monto: normalized });
                    }
                  }}
                  disabled={isSaving}
                />

                <select
                  className="select-tipo"
                  value={formTrans.tipo_transaccion}
                  onChange={(e) =>
                    setFormTrans({
                      ...formTrans,
                      tipo_transaccion: e.target.value,
                    })
                  }
                  disabled={isSaving}
                >
                  <option value="DEBE">DEBE</option>
                  <option value="HABER">HABER</option>
                </select>

                <button
                  type="button"
                  onClick={agregarTransaccion}
                  className="btn-crear"
                  disabled={isSaving}
                >
                  Agregar
                </button>
              </div>
              {transTemp.length > 0 && (
                <table className="table-trans mt-3">
                  <thead>
                    <tr>
                      <th>Cuenta</th>
                      <th>Monto</th>
                      <th>Tipo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transTemp.map((t, i) => (
                      <tr key={i}>
                        <td>{getCuentaNombre(t.cuenta_id)}</td>
                        <td>{formatMonto(t.monto)}</td>
                        <td>{t.tipo_transaccion}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => eliminarTrans(i)}
                            className="btn-cancelar"
                            disabled={isSaving}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={closeModal}
                className="btn-cancelar"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPartidaCompleta}
                className="btn-crear"
                disabled={transTemp.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" aria-hidden></span>
                    Guardando...
                  </>
                ) : (
                  "Guardar Partida"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
