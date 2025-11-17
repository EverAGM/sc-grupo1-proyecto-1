import { useState, useEffect } from "react";
import { obtenerCuentas, obtenerCuentaPorId, crearCuentaContable, actualizarCuentaContable, eliminarCuentaContable } from "../services/cuentasService";
import { Button, Input, Select, Modal } from "antd";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import { FaHome, FaPlus, FaPen, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import "./CuentasContablesPage.css";
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;

export default function CuentasContables() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "ACTIVO",
    categoria: "DEUDOR",
    parent_id: "",
  });

  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal de borrado (se mantiene intacto)
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    cuenta: null,
  });

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      const cuentasData = await obtenerCuentas();
      setCuentas(cuentasData || []);
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
      toast.error("Error al cargar las cuentas contables.");
    } finally {
      setLoading(false);
    }
  };

  const cargarCuentaPorId = async (id) => {
    try {
      const cuentaData = await obtenerCuentaPorId(id);
      if (!cuentaData) {
        toast.warn("No se encontró la cuenta seleccionada.");
        return;
      }
      setFormData({
        nombre: cuentaData.nombre || "",
        tipo: cuentaData.tipo || "ACTIVO",
        categoria: cuentaData.categoria || "DEUDOR",
        parent_id: cuentaData.padre_id || cuentaData.parent_id || "",
      });
      setSelectedCuenta(cuentaData);
      setIsEditing(true);
    } catch (err) {
      console.error("Error al obtener cuenta:", err);
      toast.error("Error al obtener la cuenta contable.");
    }
  };

  // Guardar "crear o actualizar"
  const manejarSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo.trim().toUpperCase(),
      categoria: formData.categoria.trim().toUpperCase(),
      parent_id:
        formData.parent_id === "" ? null : parseInt(formData.parent_id, 10),
    };

    try {
      if (!payload.nombre || !payload.tipo || !payload.categoria) {
        toast.warn("Nombre, tipo y categoría son obligatorios.");
        setSubmitting(false);
        return;
      }

      if (isEditing && selectedCuenta) {
        await actualizarCuentaContable(selectedCuenta.id_cuenta, payload);
        toast.success(`La cuenta "${payload.nombre}" se actualizó correctamente.`);
      } else {
        const nueva = await crearCuentaContable(payload);
        toast.success(`La cuenta "${nueva?.nombre || payload.nombre}" se creó correctamente.`);
      }

      await cargarCuentas();
      resetForm();
    } catch (err) {
      console.error("Error al guardar cuenta:", err);
      const msg = err.message?.toLowerCase() || "";

      if (err.isDuplicate || msg.includes("ya existe una cuenta contable")) {
        toast.error("Ya existe una cuenta contable con ese nombre.");
      } else {
        toast.error("Ocurrió un error al guardar la cuenta contable.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "ACTIVO",
      categoria: "DEUDOR",
      parent_id: "",
    });
    setIsEditing(false);
    setSelectedCuenta(null);
  };

  const handleEliminarCuentaClick = (cuenta) => {
    setDeleteModal({
      visible: true,
      cuenta,
    });
  };

  const cerrarDeleteModal = () => {
    setDeleteModal({
      visible: false,
      cuenta: null,
    });
  };

  const confirmarEliminarCuenta = async () => {
    const cuenta = deleteModal.cuenta;
    if (!cuenta) return;

    try {
      await eliminarCuentaContable(cuenta.id_cuenta);

      if (selectedCuenta && selectedCuenta.id_cuenta === cuenta.id_cuenta) {
        resetForm();
      }

      setCuentas((prev) =>
        prev.filter((c) => c.id_cuenta !== cuenta.id_cuenta)
      );

      toast.success(`La cuenta "${cuenta.nombre}" se eliminó correctamente.`);
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
      const msg = err.message?.toLowerCase() || "";

      if (
        err.isFK ||
        err.code === "23001" ||
        msg.includes("tiene registros asociados") ||
        msg.includes("fk_cuenta_padre") ||
        msg.includes("foreign key")
      ) {
        toast.error("No se puede eliminar esta cuenta porque tiene cuentas hijas asociadas.");
      } else {
        toast.error("Ocurrió un error al intentar eliminar la cuenta contable.");
      }
    } finally {
      cerrarDeleteModal();
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const getNombrePadre = (cuenta) => {
    if (!cuenta.padre_id) return "";
    const padre = cuentas.find((c) => c.id_cuenta === cuenta.padre_id);
    return padre ? `${padre.codigo} - ${padre.nombre}` : cuenta.padre_id;
  };

  return (
    <div className="cuentas-contables">
      <header className="page-header">
        <h1>Cuentas Contables</h1>

        <Link to="/" className="back-link-header"><FaHome /> Volver al inicio</Link>
      </header>

      <div className="dashboard-grid">
        <section className="panel panel-form">
          <h2 className="panel-title">
            {isEditing ? "Editar cuenta contable" : "Nueva cuenta contable"}
          </h2>

          <form onSubmit={manejarSubmit} className="form-cuenta">
            <div className="form-group">
              <label>Código</label>
              <Input type="text" value={selectedCuenta ? selectedCuenta.codigo : ""}
                disabled className="readonly-input" placeholder="Se asignará al guardar"/>
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <Select value={formData.tipo} 
              onChange={(value) => setFormData({ ...formData, tipo: value })} disabled={isEditing}>
                <Option value="ACTIVO">ACTIVO</Option>
                <Option value="PASIVO">PASIVO</Option>
                <Option value="PATRIMONIO">PATRIMONIO</Option>
                <Option value="GASTO">GASTO O COSTO</Option>
                <Option value="INGRESO">INGRESO</Option>
              </Select>
            </div>

            <div className="form-group">
              <label>Nombre</label>
              <Input type="text" value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required/>
            </div>

            <div className="form-group">
              <label>Cuenta Padre</label>
              <Select allowClear placeholder="Seleccione cuenta padre" value={formData.parent_id || undefined}
                onChange={(value) => setFormData({ ...formData, parent_id: value ?? "" })}
                showSearch optionFilterProp="label" disabled={isEditing}>
                {cuentas.map((c) => (
                  <Option key={c.id_cuenta} value={c.id_cuenta}
                    label={`${c.codigo} - ${c.nombre}`}>
                    {c.codigo} - {c.nombre}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <Select value={formData.categoria}
                onChange={(value) => setFormData({ ...formData, categoria: value })} required>
                <Option value="DEUDOR">Deudor</Option>
                <Option value="ACREEDOR">Acreedor</Option>
              </Select>
            </div>

            <div className="form-actions">
              <Button type="primary" htmlType="submit" block loading={submitting} icon={isEditing ? <FaSave /> : <FaPlus />}>
                {isEditing ? "Actualizar Cuenta" : "Crear Cuenta"}
              </Button>
              {isEditing && (
                <Button style={{ marginTop: 8 }} onClick={resetForm} block disabled={submitting} icon={<FaTimes />}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="panel panel-table">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title">Lista de Cuentas</h2>
            </div>
            {loading && <span className="badge-loading">Cargando...</span>}
          </div>

          <div className="table-wrapper">
            <table className="cuentas-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Padre</th>
                  <th>AccIONES</th>
                </tr>
              </thead>
              <tbody>
                {cuentas && cuentas.length > 0 ? (
                  cuentas.map((cuenta) => {
                    const tieneHijos = cuentas.some(
                      (c) => c.padre_id === cuenta.id_cuenta
                    );
                    return (
                      <tr key={cuenta.id_cuenta}>
                        <td>{cuenta.codigo}</td>
                        <td>{cuenta.nombre}</td>
                        <td>{cuenta.tipo}</td>
                        <td>{cuenta.categoria}</td>
                        <td>{getNombrePadre(cuenta)}</td>
                        <td>
                          <Button size="small" icon={<FaPen />} onClick={() => cargarCuentaPorId(cuenta.id_cuenta)}>
                            Editar
                          </Button>
                          {!tieneHijos && (
                            <Button size="small" danger style={{ marginLeft: 8 }} icon={<FaTrash />}
                              onClick={() => handleEliminarCuentaClick(cuenta)}>
                              Eliminar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      No hay cuentas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal open={deleteModal.visible} title="Confirmar eliminación" onCancel={cerrarDeleteModal}
        onOk={confirmarEliminarCuenta} okText="Eliminar" okButtonProps={{ danger: true }}
        cancelText="Cancelar" centered>
        <p>
          ¿Seguro que deseas eliminar la cuenta "
          {deleteModal.cuenta?.codigo} - {deleteModal.cuenta?.nombre}"?
        </p>
      </Modal>
      <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
    </div>
    
  );
}