import { useState, useEffect, useMemo } from "react";
import { 
  obtenerPeriodos, 
  crearPeriodo, 
  actualizarPeriodo, 
  eliminarPeriodo 
} from "../services/periodosService";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";
import { FaPlus, FaHome, FaUndo, FaPen, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import "./PeriodosPage.css";

const trimestresBase = [
  { key: '1', label: 'Trimestre 1 (Ene - Mar)' },
  { key: '2', label: 'Trimestre 2 (Abr - Jun)' },
  { key: '3', label: 'Trimestre 3 (Jul - Sep)' },
  { key: '4', label: 'Trimestre 4 (Oct - Dic)' },
];

const estadosBase = ['ACTIVO', 'PRÓXIMO', 'FINALIZADO'];
const anioActual = new Date().getFullYear();
const aniosParaCrear = [anioActual - 1, anioActual, anioActual + 1, anioActual + 2];

const getDynamicEstado = (fechaInicioISO, fechaFinISO) => {
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  
  if (!fechaInicioISO || !fechaFinISO) return 'INDETERMINADO';
  
  const inicio = new Date(fechaInicioISO);
  const fin = new Date(fechaFinISO);
  fin.setUTCHours(23, 59, 59, 999); 

  if (todayUTC >= inicio && todayUTC <= fin) {
    return 'ACTIVO';
  }
  if (todayUTC < inicio) {
    return 'PRÓXIMO';
  }
  if (todayUTC > fin) {
    return 'FINALIZADO';
  }
  return 'INDETERMINADO';
};

const parseFechaISO = (isoString) => {
  if (!isoString) return { anio: null, mes: null, trimestre: null };
  const fecha = new Date(isoString);
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth(); 
  let trimestre;
  if (mes < 3) trimestre = '1';
  else if (mes < 6) trimestre = '2';
  else if (mes < 9) trimestre = '3';
  else trimestre = '4';
  return { anio, trimestre };
};

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("ACTIVO");

  const [anioSeleccionadoModal, setAnioSeleccionadoModal] = useState(anioActual);
  const [trimestreSeleccionadoModal, setTrimestreSeleccionadoModal] = useState("");

  const [filterAnio, setFilterAnio] = useState("todos");
  const [filterTrimestre, setFilterTrimestre] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");

  const cargarPeriodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerPeriodos();
      setPeriodos(data);
    } catch (err) {
      setError('Error de conexión al cargar periodos');
      toast.error('Error de conexión al cargar periodos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const periodosOcupadosModal = useMemo(() => {
    return periodos
      .map(p => parseFechaISO(p.fecha_inicio))
      .filter(p => p.anio === anioSeleccionadoModal)
      .map(p => p.trimestre);
  }, [periodos, anioSeleccionadoModal]);

  const trimestresDisponiblesModal = useMemo(() => {
    return trimestresBase.filter(t => !periodosOcupadosModal.includes(t.key));
  }, [periodosOcupadosModal]);

  useEffect(() => {
    if (trimestresDisponiblesModal.length > 0) {
      setTrimestreSeleccionadoModal(trimestresDisponiblesModal[0].key);
    } else {
      setTrimestreSeleccionadoModal("");
    }
  }, [trimestresDisponiblesModal]);

  const aniosParaFiltro = useMemo(() => {
    const anios = new Set(periodos.map(p => parseFechaISO(p.fecha_inicio).anio));
    return Array.from(anios).filter(a => a != null).sort((a, b) => b - a);
  }, [periodos]);

  const listaFiltrada = useMemo(() => {
    return periodos
      .map(p => {
        const { anio, trimestre } = parseFechaISO(p.fecha_inicio);
        return { ...p, anio, trimestre };
      })
      .filter(p => {
        if (filterAnio !== 'todos' && p.anio !== parseInt(filterAnio)) return false;
        if (filterTrimestre !== 'todos' && p.trimestre !== filterTrimestre) return false;
        if (filterEstado !== 'todos' && p.estado !== filterEstado) return false;
        return true;
      })
      .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
  }, [periodos, filterAnio, filterTrimestre, filterEstado]);

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setIsSaving(false);
  }

  const openEditModal = (periodo) => {
    setPeriodoSeleccionado(periodo);
    setNuevoEstado(periodo.estado);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setPeriodoSeleccionado(null);
    setIsSaving(false);
  };

  const openDeleteModal = (periodo) => {
    setPeriodoSeleccionado(periodo);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPeriodoSeleccionado(null);
    setIsSaving(false);
  };

  const getFechasParaBackend = (anio, trimestre) => {
    switch (trimestre) {
      case '1': return { fecha_inicio: `01/01/${anio}`, fecha_fin: `31/03/${anio}` };
      case '2': return { fecha_inicio: `01/04/${anio}`, fecha_fin: `30/06/${anio}` };
      case '3': return { fecha_inicio: `01/07/${anio}`, fecha_fin: `30/09/${anio}` };
      case '4': return { fecha_inicio: `01/10/${anio}`, fecha_fin: `31/12/${anio}` };
      default: throw new Error('Trimestre inválido');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      if (isNaN(year)) return "Fecha inválida";
      return `${day}/${month}/${year}`;
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!trimestreSeleccionadoModal) {
      toast.warn("No hay trimestres disponibles para este año.");
      return;
    }

    setIsSaving(true);
    try {
      const { fecha_inicio, fecha_fin } = getFechasParaBackend(anioSeleccionadoModal, trimestreSeleccionadoModal);
      
      const [diaI, mesI, anioI] = fecha_inicio.split('/');
      const [diaF, mesF, anioF] = fecha_fin.split('/');
      
      const inicio = new Date(anioI, mesI - 1, diaI);
      const fin = new Date(anioF, mesF - 1, diaF);
      fin.setHours(23, 59, 59, 999); 

      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      
      let estadoCalculado;
      if (today >= inicio && today <= fin) {
        estadoCalculado = 'ACTIVO';
      } else if (today < inicio) {
        estadoCalculado = 'PRÓXIMO';
      } else {
        estadoCalculado = 'FINALIZADO';
      }
      
      const dataParaEnviar = {
        fecha_inicio,
        fecha_fin,
        estado: estadoCalculado
      };

      const resultado = await crearPeriodo(dataParaEnviar);
      if (resultado.success) {
        toast.success("Período creado exitosamente");
        closeModal();
        await cargarPeriodos(); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitEditModal = async (e) => {
    e.preventDefault();
    if (!periodoSeleccionado) return;
    
    setIsSaving(true);
    try {
      const datosParaAPI = {
        fecha_inicio: formatDate(periodoSeleccionado.fecha_inicio),
        fecha_fin: formatDate(periodoSeleccionado.fecha_fin),
        estado: nuevoEstado
      };
      
      const resultado = await actualizarPeriodo(periodoSeleccionado.id_periodo, datosParaAPI);
      if (resultado.success) {
        toast.success("Período actualizado exitosamente");
        closeEditModal();
        await cargarPeriodos();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSubmitDeleteModal = async () => {
    if (!periodoSeleccionado) return;
  
    setIsSaving(true);
    try {
      const resultado = await eliminarPeriodo(periodoSeleccionado.id_periodo);
      if (resultado.success) {
        toast.success("Período eliminado exitosamente");
        closeDeleteModal();
        await cargarPeriodos();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setFilterAnio("todos");
    setFilterTrimestre("todos");
    setFilterEstado("todos");
  };

  return (
    <div className="periodos-page">
      <header className="page-header">
        <h1>Periodos Contables</h1>
        <Link to="/" className="back-link-header">
          <FaHome />
          <span>Volver al inicio</span>
        </Link>
      </header>

      <div className="header-acciones">
        <button onClick={openModal} className="btn-crear">
          <FaPlus />
          <span>Crear Periodo Contable</span>
        </button>
      </div>

      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="filter-anio">Filtrar por Año</label>
          <select id="filter-anio" value={filterAnio} onChange={(e) => setFilterAnio(e.target.value)}>
            <option value="todos">Todos los Años</option>
            {aniosParaFiltro.map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-trimestre">Filtrar por Periodo</label>
          <select id="filter-trimestre" value={filterTrimestre} onChange={(e) => setFilterTrimestre(e.target.value)}>
            <option value="todos">Todos los Periodos</option>
            {trimestresBase.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-estado">Filtrar por Estado</label>
          <select id="filter-estado" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="todos">Todos los Estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="PRÓXIMO">Próximo</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
        <button onClick={resetFilters} className="btn-secondary">
          <FaUndo />
          <span>Limpiar Filtros</span>
        </button>
      </div>

      <div className="table-container">
        <table className="periodos-table">
          <thead>
            <tr>
              <th className="col-id">ID Periodo</th>
              <th className="col-fecha">Fecha de Inicio</th>
              <th className="col-fecha">Fecha de Fin</th>
              <th className="col-estado">Estado</th>
              <th className="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="text-center">Cargando...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan="5" className="text-center error-text">{error}</td>
              </tr>
            )}
            {!loading && !error && listaFiltrada.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">
                  {periodos.length === 0 ? "No hay periodos creados." : "No se encontraron periodos con esos filtros."}
                </td>
              </tr>
            )}
            {!loading && !error && listaFiltrada.map((p) => (
              <tr key={p.id_periodo}>
                <td>{p.id_periodo}</td>
                <td>{formatDate(p.fecha_inicio)}</td>
                <td>{formatDate(p.fecha_fin)}</td>
                <td className="estado-cell">
                  <span className={`estado-badge estado-${p.estado}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="acciones-cell">
                  <button onClick={() => openEditModal(p)} className="btn-accion btn-editar">
                    <FaPen />
                    <span>Editar</span>
                  </button>
                  <button onClick={() => openDeleteModal(p)} className="btn-accion btn-eliminar">
                    <FaTrash />
                    <span>Eliminar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Periodo</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Cerrar">
                <IoMdClose />
              </button>
            </div>
            <form onSubmit={handleSubmitModal}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="anio-select">Año</label>
                  <select
                    id="anio-select"
                    value={anioSeleccionadoModal}
                    onChange={(e) => setAnioSeleccionadoModal(Number(e.target.value))}
                    disabled={isSaving}
                  >
                    {aniosParaCrear.map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="trimestre-select">Trimestre</label>
                  {trimestresDisponiblesModal.length > 0 ? (
                    <select
                      id="trimestre-select"
                      value={trimestreSeleccionadoModal}
                      onChange={(e) => setTrimestreSeleccionadoModal(e.target.value)}
                      disabled={isSaving}
                    >
                      {trimestresDisponiblesModal.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="error-message">
                      Todos los periodos para el año {anioSeleccionadoModal} ya están creados.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  <FaTimes />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="btn-crear"
                  disabled={isSaving || trimestresDisponiblesModal.length === 0}
                >
                  <FaPlus />
                  <span>{isSaving ? "Guardando..." : "Crear Periodo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && periodoSeleccionado && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar {periodoSeleccionado.anio} - Periodo {periodoSeleccionado.trimestre}</h2>
              <button className="modal-close" onClick={closeEditModal} aria-label="Cerrar">
                <IoMdClose />
              </button>
            </div>
            <form onSubmit={handleSubmitEditModal}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Periodo</label>
                  <input 
                    type="text" 
                    disabled 
                    value={`${formatDate(periodoSeleccionado.fecha_inicio)} - ${formatDate(periodoSeleccionado.fecha_fin)}`} 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="estado-select">Estado</label>
                  <select
                    id="estado-select"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    disabled={isSaving}
                  >
                    {estadosBase.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={closeEditModal}
                  disabled={isSaving}
                >
                  <FaTimes />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="btn-crear"
                  disabled={isSaving}
                >
                  <FaSave />
                  <span>{isSaving ? "Guardando..." : "Actualizar Estado"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && periodoSeleccionado && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal modal-delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={closeDeleteModal} aria-label="Cerrar">
                <IoMdClose />
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de que deseas eliminar el periodo del <br />
                <strong>{formatDate(periodoSeleccionado.fecha_inicio)}</strong> al <strong>{formatDate(periodoSeleccionado.fecha_fin)}</strong>?
              </p>
              <p>Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancelar"
                onClick={closeDeleteModal}
                disabled={isSaving}
              >
                <FaTimes />
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                className="btn-eliminar-confirm"
                onClick={handleSubmitDeleteModal}
                disabled={isSaving}
              >
                <FaTrash />
                <span>{isSaving ? "Eliminando..." : "Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}