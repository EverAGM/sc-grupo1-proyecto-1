import { useEffect, useState, useRef, useMemo } from "react";
import {
  obtenerTransacciones,
  crearTransaccion,
} from "../services/transaccionesService";
import { obtenerCuentas } from "../services/cuentasService";
import {
  crearPartida,
  obtenerPartidaPorId,
} from "../services/partidaDiariaService";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";
import { obtenerPeriodos } from "../services/periodosService";
import "./TransaccionesPage.css";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const trimestresBase = [
  { key: "1", label: "Trimestre 1 (Ene - Mar)" },
  { key: "2", label: "Trimestre 2 (Abr - Jun)" },
  { key: "3", label: "Trimestre 3 (Jul - Sep)" },
  { key: "4", label: "Trimestre 4 (Oct - Dic)" },
];

const getDynamicEstado = (fechaInicioISO, fechaFinISO) => {
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  if (!fechaInicioISO || !fechaFinISO) return "INDETERMINADO";

  const inicio = new Date(fechaInicioISO);
  const fin = new Date(fechaFinISO);
  fin.setUTCHours(23, 59, 59, 999);

  if (todayUTC >= inicio && todayUTC <= fin) {
    return "ACTIVO";
  }
  if (todayUTC < inicio) {
    return "PRÓXIMO";
  }
  if (todayUTC > fin) {
    return "FINALIZADO";
  }
  return "INDETERMINADO";
};

const parseFechaISO = (isoString) => {
  if (!isoString) return { anio: null, mes: null, trimestre: null };
  const fecha = new Date(isoString);
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth();
  let trimestre;
  if (mes < 3) trimestre = "1";
  else if (mes < 6) trimestre = "2";
  else if (mes < 9) trimestre = "3";
  else trimestre = "4";
  return { anio, trimestre };
};

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

  const [activePeriodo, setActivePeriodo] = useState(null);
  const formatPeriodoLabel = (p) => {
    if (!p || !p.fecha_inicio || !p.fecha_fin) return "";
    const monthsShort = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const d1 = new Date(p.fecha_inicio);
    const d2 = new Date(p.fecha_fin);
    const mon1 = monthsShort[d1.getUTCMonth()] || "";
    const mon2 = monthsShort[d2.getUTCMonth()] || "";
    const yy1 = String(d1.getUTCFullYear()).slice(2);
    const yy2 = String(d2.getUTCFullYear()).slice(2);
    return `${mon1}-${yy1} a ${mon2}-${yy2}`;
  };

  // detect active periodo when periodos list updates
  useEffect(() => {
    if (!periodos || periodos.length === 0) {
      setActivePeriodo(null);
      return;
    }
    const ap = periodos.find((p) =>
      getDynamicEstado(p.fecha_inicio, p.fecha_fin) === "ACTIVO"
    );
    setActivePeriodo(ap || null);
  }, [periodos]);
  useEffect(() => {
    if (activePeriodo) {
      setPartida((prev) => ({ ...prev, id_periodo: activePeriodo.id_periodo }));
    }
  }, [activePeriodo]);

  const parseDisplayToIso = (display) => {
    if (!display) return null;
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    const isLeap = (y) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
    const daysInMonth = (mth, y) => {
      if (mth === 2) return isLeap(y) ? 29 : 28;
      return [1, 3, 5, 7, 8, 10, 12].includes(mth) ? 31 : 30;
    };

    const maxDay = daysInMonth(month, year);
    if (day < 1 || day > maxDay) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toISOString().split("T")[0];
  };

  const maskDateInput = (raw) => {
    if (raw == null) return "";
    const digits = raw.replace(/\D/g, "").slice(0, 8); // ddmmyyyy max 8
    let parts = [];
    const day = digits.slice(0, 2);
    let month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    if (month.length > 0) {
      const mNum = parseInt(month, 10);
      if (!Number.isNaN(mNum) && mNum > 12) {
        month = "12".slice(0, month.length);
      }
    }
    if (day.length === 2 && month.length === 2) {
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      let maxDay = 31;
      if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        if (year.length === 4) {
          const yNum = parseInt(year, 10);
          const isLeap = (y) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
          if (monthNum === 2) maxDay = isLeap(yNum) ? 29 : 28;
          else if ([4, 6, 9, 11].includes(monthNum)) maxDay = 30;
          else maxDay = 31;
        } else {
          if (monthNum === 2) maxDay = 29;
          else if ([4, 6, 9, 11].includes(monthNum)) maxDay = 30;
          else maxDay = 31;
        }

        if (!Number.isNaN(dayNum) && dayNum > maxDay) {
          const repl = String(maxDay).padStart(2, "0");
          if (repl.length === 2) {
            const newDigits = repl + month + year;
            const newDay = newDigits.slice(0, 2);
            var _maskedDay = newDay;
          }
        }
      }
    }
    if (digits.length <= 2) {
      parts = [typeof _maskedDay !== 'undefined' ? _maskedDay : day];
    } else if (digits.length <= 4) {
      parts = [typeof _maskedDay !== 'undefined' ? _maskedDay : day, month || digits.slice(2)];
    } else {
      parts = [typeof _maskedDay !== 'undefined' ? _maskedDay : day, month || digits.slice(2, 4), year];
    }
    return parts.filter(Boolean).join('/');
  };

  // helper: format ISO yyyy-mm-dd -> display dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear());
    return `${day}/${month}/${year}`;
  };

  const [transTemp, setTransTemp] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [formTrans, setFormTrans] = useState({
    cuenta_id: "",
    monto: "",
    tipo_transaccion: "DEBE",
    fecha_operacion: formatDate(new Date().toISOString().split("T")[0]),
    fecha_operacion_iso: new Date().toISOString().split("T")[0],
  });

  const [filterAnio, setFilterAnio] = useState("todos");
  const [filterTrimestre, setFilterTrimestre] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");

  const cargarTransacciones = async () => {
    const data = await obtenerTransacciones();
    setTransacciones(data);
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
      id_periodo: activePeriodo ? activePeriodo.id_periodo : "",
      fecha_creacion: new Date().toISOString().split("T")[0],
    });
    setTransTemp([]);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const agregarTransaccion = () => {
    if (!formTrans.cuenta_id || !formTrans.monto) return;
    // validate fecha_operacion if provided
    if (formTrans.fecha_operacion && !parseDisplayToIso(formTrans.fecha_operacion)) {
      toast.warn("Formato de Fecha Operación inválido. Use DD/MM/YYYY");
      return;
    }

    const todayIso = new Date().toISOString().split("T")[0];
    const fechaIso = formTrans.fecha_operacion_iso || parseDisplayToIso(formTrans.fecha_operacion) || todayIso;
    const fechaDisplay = formTrans.fecha_operacion && formTrans.fecha_operacion.trim() !== "" ? formTrans.fecha_operacion : formatDate(fechaIso);

    setTransTemp([
      ...transTemp,
      {
        ...formTrans,
        fecha_operacion: fechaDisplay, 
        fecha_operacion_iso: fechaIso,
      },
    ]);

    // reset form keeping fecha_operacion to today (display + iso)
    setFormTrans({
      cuenta_id: "",
      monto: "",
      tipo_transaccion: "DEBE",
      fecha_operacion: formatDate(todayIso),
      fecha_operacion_iso: todayIso,
    });
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

  const aniosParaFiltro = useMemo(() => {
    const anios = new Set(
      periodos.map((p) => parseFechaISO(p.fecha_inicio).anio)
    );
    return Array.from(anios)
      .filter((a) => a != null)
      .sort((a, b) => b - a);
  }, [periodos]);

  const listaFiltrada = useMemo(() => {
    return transacciones
      .map((t) => {
        const { anio, trimestre } = parseFechaISO(t.periodo_fecha_inicio);
        const estadoActual = getDynamicEstado(
          t.periodo_fecha_inicio,
          t.periodo_fecha_fin
        );

        let periodoLabel = "N/A";
        if (anio && trimestre) {
          periodoLabel = `${anio} - Trimestre ${trimestre}`;
        }

        return { ...t, anio, trimestre, estadoActual, periodoLabel };
      })
      .filter((t) => {
        if (filterAnio !== "todos" && t.anio !== parseInt(filterAnio))
          return false;
        if (filterTrimestre !== "todos" && t.trimestre !== filterTrimestre)
          return false;
        if (filterEstado !== "todos" && t.estadoActual !== filterEstado)
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
  }, [transacciones, filterAnio, filterTrimestre, filterEstado]);

  const resetFilters = () => {
    setFilterAnio("todos");
    setFilterTrimestre("todos");
    setFilterEstado("todos");
  };

  const guardarPartidaCompleta = async () => {
    if (!partida.concepto || !partida.id_periodo) {
      toast.warn("Debe ingresar concepto y periodo");
      return;
    }

    try {
      if (transTemp.length === 0) {
        toast.warn(
          "Debe agregar al menos una transacción antes de guardar la partida"
        );
        return;
      }
      setIsSaving(true);
      const nuevaPartida = await crearPartida(partida);

      if (nuevaPartida?.id_partida_diaria) {
        for (const t of transTemp) {
          const fechaIsoToSend =
            t.fecha_operacion_iso ||
            parseDisplayToIso(t.fecha_operacion) ||
            new Date().toISOString().split("T")[0];

          const payload = {
            ...t,
            partida_diaria_id: nuevaPartida.id_partida_diaria,
            fecha_operacion: fechaIsoToSend,
          };

          await crearTransaccion(payload);
        }
        toast.success("Partida y transacciones guardadas correctamente");
        closeModal();
        await cargarTransacciones();
      }
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Ocurrió un error al guardar la partida";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportar = () => {
    setIsExporting(true);
    try {
      const datosFormateados = listaFiltrada.map((t) => ({
        Fecha: formatDate(t.fecha_creacion),
        Periodo: t.periodo_fecha_inicio
          ? `${formatDate(t.periodo_fecha_inicio)} - ${formatDate(
              t.periodo_fecha_fin
            )}`
          : "N/A",
        Cuenta: getCuentaNombre(t.cuenta_id),
        Monto: parseFloat(formatMonto(t.monto)),
        Tipo: t.tipo_transaccion,
        "Concepto Partida": getConceptoPartida(t.partida_diaria_id),
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

      XLSX.writeFile(
        workbook,
        `reporte_transacciones_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast.success("Reporte de transacciones generado con éxito.");
    } catch (error) {
      console.error("Error al exportar en el frontend:", error);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="transacciones-page">
      <header className="page-header">
        <h1>Periodos Contables</h1>
        <Link to="/" className="back-link-header">
          <FaHome />
          <span>Volver al inicio</span>
        </Link>
      </header>
      <h1>Transacciones Contables</h1>

      <div className="header-acciones">
        <button
          onClick={handleExportar}
          className="btn-exportar"
          disabled={isExporting || isSaving}
        >
          {isExporting ? (
            <>
              <span className="spinner" aria-hidden></span>Exportando...
            </>
          ) : (
            "Exportar Excel"
          )}
        </button>
        <button
          onClick={openModal}
          className="btn-crear"
          disabled={isSaving || isExporting}
        >
          Crear Nueva Partida
        </button>
      </div>

      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="filter-anio">Filtrar por Año</label>
          <select
            id="filter-anio"
            value={filterAnio}
            onChange={(e) => setFilterAnio(e.target.value)}
          >
            <option value="todos">Todos los Años</option>
            {aniosParaFiltro.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-trimestre">Filtrar por Periodo</label>
          <select
            id="filter-trimestre"
            value={filterTrimestre}
            onChange={(e) => setFilterTrimestre(e.target.value)}
          >
            <option value="todos">Todos los Periodos</option>
            {trimestresBase.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-estado">Filtrar por Estado Periodo</label>
          <select
            id="filter-estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="PRÓXIMO">Próximo</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <button onClick={resetFilters} className="btn-secondary">
          Limpiar
        </button>
      </div>

      <div className="table-container">
        <table className="transacciones-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Periodo</th>
                <th>Cuenta</th>
                <th>Fecha Op</th>
              <th className="monto-cell">Monto</th>
              <th>Tipo</th>
              <th>Concepto de Partida</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map((t) => (
              <tr key={t.id_transaccion}>
                <td>{formatDate(t.fecha_creacion)}</td>
                <td>
                  {t.periodo_fecha_inicio || t.periodo_fecha_fin ? (
                    formatPeriodoLabel({
                      fecha_inicio: t.periodo_fecha_inicio,
                      fecha_fin: t.periodo_fecha_fin,
                    })
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{getCuentaNombre(t.cuenta_id)}</td>
                <td>{formatDate(t.fecha_operacion)}</td>
                <td className="monto-cell">{formatMonto(t.monto)}</td>
                <td className={`tipo-${t.tipo_transaccion}`}>
                  {t.tipo_transaccion}
                </td>
                <td>{getConceptoPartida(t.partida_diaria_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <h2>Nueva Partida Diaria</h2>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div
              className="modal-body"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              <form
                onSubmit={(e) => e.preventDefault()}
                className="form-partida"
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>Fecha de Creación</label>
                    <input
                      type="text"
                      value={formatDate(partida.fecha_creacion)}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Periodo</label>
                    {activePeriodo ? (
                      <input
                        type="text"
                        value={formatPeriodoLabel(activePeriodo)}
                        disabled
                      />
                    ) : (
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
                            {p.id_periodo} - {formatDate(p.fecha_inicio)} al{" "}
                            {formatDate(p.fecha_fin)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
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
              </form>

              <hr
                style={{
                  margin: "20px 0",
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                }}
              />

              <h3>Transacciones de esta partida</h3>
              <div className="form-transaccion-inline">
                <div className="top-left">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Cuenta</label>
                    <select
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
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Monto</label>
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
                        if (/^\d*\.?\d{0,2}$/.test(normalized)) {
                          setFormTrans({ ...formTrans, monto: normalized });
                        }
                      }}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-trans-button">
                  <button
                    type="button"
                    onClick={agregarTransaccion}
                    className="btn-crear"
                    disabled={isSaving}
                  >
                    Agregar
                  </button>
                </div>

                <div className="bottom-left">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Tipo</label>
                    <select
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
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Fecha Operación</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      inputMode="numeric"
                      value={formTrans.fecha_operacion}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const masked = maskDateInput(raw);
                        const iso = parseDisplayToIso(masked);
                        setFormTrans({
                          ...formTrans,
                          fecha_operacion: masked,
                          fecha_operacion_iso: iso ? iso : formTrans.fecha_operacion_iso,
                        });
                      }}
                      disabled={isSaving}
                      pattern="\d{2}/\d{2}/\d{4}"
                      title="Ingrese la fecha en formato DD/MM/YYYY"
                    />
                  </div>
                </div>
              </div>

              {transTemp.length > 0 && (
                <div
                  className="table-container"
                  style={{
                    marginTop: "16px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  <table className="transacciones-table">
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th className="monto-cell">Monto</th>
                        <th>Fecha Op</th>
                        <th>Tipo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transTemp.map((t, i) => (
                        <tr key={i}>
                          <td>{getCuentaNombre(t.cuenta_id)}</td>
                          <td className="monto-cell">{formatMonto(t.monto)}</td>
                          <td>{t.fecha_operacion}</td>
                          <td>{t.tipo_transaccion}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => eliminarTrans(i)}
                              className="btn-cancelar"
                              style={{ padding: "4px 8px" }}
                              disabled={isSaving}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
