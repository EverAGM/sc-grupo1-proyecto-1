import { useState, useEffect } from "react";
import { obtenerBalanceContable, verificarIntegridadContable } from "../services/balanceService";
import { toast } from 'react-toastify';
import "./BalancePage.css";
import {
  MdRefresh,
  MdCheck,
  MdWarning,
  MdKeyboardArrowDown
} from "react-icons/md";
import { CgSpinner } from "react-icons/cg";

export default function BalancePage() {
  const [balanceData, setBalanceData] = useState({
    debe: 0,
    haber: 0,
    cuadrado: false,
    diferencia: 0,
    totalTransacciones: 0,
    fechaVerificacion: null
  });

  const [transaccionesIncompletas, setTransaccionesIncompletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integridadData, setIntegridadData] = useState(null);

  // Cargar datos del balance
  const cargarBalance = async () => {
    try {
      setLoading(true);
      
      const resultado = await obtenerBalanceContable();
      
      if (resultado.success) {
        setBalanceData(resultado.data);
        setTransaccionesIncompletas(resultado.data.transaccionesIncompletas || []);
      } else {
        toast.error(resultado.error || 'Error al cargar el balance');
      }
    } catch (err) {
      console.error('Error al cargar balance:', err);
      toast.error('Error de conexión al cargar el balance');
    } finally {
      setLoading(false);
    }
  };

  // Verificar integridad completa del sistema
  const verificarIntegridad = async () => {
    try {
      const resultado = await verificarIntegridadContable();
      
      if (resultado.success) {
        setIntegridadData(resultado.data.integridad);
      }
    } catch (err) {
      console.error('Error al verificar integridad:', err);
    }
  };

  useEffect(() => {
    cargarBalance();
  }, []);

  // Actualizar integridad cuando cambien los datos del balance
  useEffect(() => {
    if (balanceData && balanceData.fechaVerificacion) {
      verificarIntegridad();
    }
  }, [balanceData]);

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="balance-page">
        <h1>Verificación de Balance</h1>
        <div className="verificar-balance-card">
          <div className="loading-state">
            <CgSpinner className="spinner-icon" />
            <span>Cargando datos del balance...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-page">
      <h1>Verificación de Balance</h1>
      
      {/* Información de última actualización */}
      {balanceData.fechaVerificacion && (
        <div className="info-actualizacion">
          <span>
            Última verificación: {new Date(balanceData.fechaVerificacion).toLocaleString()}
          </span>
          <button onClick={cargarBalance} className="actualizar-btn" disabled={loading}>
            <MdRefresh /> Actualizar
          </button>
        </div>
      )}

      {/* Sección Verificar Balance */}
      <div className="verificar-balance-card">
        <div className="balance-header">
          <h2>Verificar balance</h2>
          <div className="balance-status">
            {balanceData.cuadrado ? (
              <div className="status-cuadrado">
                <span className="checkmark"><MdCheck /></span>
                <span>Cuadrado</span>
              </div>
            ) : (
              <div className="status-descuadrado">
                <span className="error-mark"><MdWarning /></span>
                <span>Descuadrado</span>
                <span className="diferencia">
                  Diferencia: {formatMonto(Math.abs(balanceData.diferencia))}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="balance-content">
          <div className="balance-layout">
            <div className="balance-montos">
              <div className="monto-item">
                <label>Debe</label>
                <span className="monto">{formatMonto(balanceData.debe)}</span>
              </div>
              <div className="monto-item">
                <label>Haber</label>
                <span className="monto">{formatMonto(balanceData.haber)}</span>
              </div>
            </div>

            <div className="transacciones-incompletas">
              <select className="dropdown-incompletas">
                <option value="">
                  Transacciones incompletas ({transaccionesIncompletas.length})
                </option>
                {transaccionesIncompletas.map((problema) => (
                  <option key={problema.id} value={problema.id}>
                    {problema.descripcion}
                  </option>
                ))}
              </select>
              <span className="dropdown-arrow"><MdKeyboardArrowDown /></span>
            </div>
          </div>

          {/* Información adicional del balance */}
          <div className="balance-info">
            <div className="info-item">
              <label>Total de transacciones:</label>
              <span>{balanceData.totalTransacciones}</span>
            </div>
            {integridadData && (
              <div className="integridad-info">
                <div className="info-item">
                  <label>Problemas detectados:</label>
                  <span className={integridadData.sinProblemas ? 'success' : 'warning'}>
                    {integridadData.totalProblemas}
                  </span>
                </div>
                {integridadData.totalProblemas > 0 && (
                  <div className="problemas-desglose">
                    <small>
                      Sin partida: {integridadData.problemasDesglosados.sinPartida} | 
                      Monto inválido: {integridadData.problemasDesglosados.montoInvalido} | 
                      Cuenta inválida: {integridadData.problemasDesglosados.cuentaInvalida} |
                      Tipo inválido: {integridadData.problemasDesglosados.tipoInvalido}
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}