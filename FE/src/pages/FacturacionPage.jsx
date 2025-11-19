import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, DatePicker, InputNumber, Popconfirm, Tooltip, message } from 'antd';
import { FaFileInvoiceDollar, FaPlus, FaEye, FaEdit, FaTrash, FaSpinner, FaInbox, FaFilter, FaSave, FaTimes, FaHome, FaCalendarAlt } from 'react-icons/fa';
import { BiRefresh } from 'react-icons/bi';
import { Link } from "react-router-dom";
import moment from 'moment';
import * as facturacionService from '../services/facturacionService';
import { obtenerPeriodos } from '../services/periodosService';
import './FacturacionPage.css';

const { Option } = Select;

const FacturacionPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingFactura, setViewingFactura] = useState(null);
  const [form] = Form.useForm();
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarFacturas();
    cargarPeriodos();
  }, []);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const data = await facturacionService.obtenerFacturas();
      setFacturas(data);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      message.error('Error al cargar las facturas');
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarPeriodos = async () => {
    setLoadingPeriodos(true);
    try {
      const data = await obtenerPeriodos();
      setPeriodos(data || []);
    } catch (error) {
      console.error('Error al cargar períodos:', error);
      message.error('Error al cargar los períodos contables');
      setPeriodos([]);
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const handleCrearFactura = () => {
    setEditingFactura(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleVerDetalles = (factura) => {
    setViewingFactura(factura);
    setViewModalVisible(true);
  };

  const handleEditarFactura = (factura) => {
    setEditingFactura(factura);
    form.setFieldsValue({
      ...factura,
      fecha_emision: moment(factura.fecha_emision)
    });
    setModalVisible(true);
  };

  const handleEliminarFactura = async (id) => {
    try {
      await facturacionService.eliminarFactura(id);
      message.success('Factura eliminada exitosamente');
      cargarFacturas();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      message.error(error.message || 'Error al eliminar la factura');
    }
  };

  const generarCUFE = (numeroFactura, fechaEmision, clienteNombre, total) => {
    const fecha = new Date(fechaEmision);
    const timestamp = fecha.getTime();
    const random = Math.floor(Math.random() * 10000);
    const hash = simpleHash(numeroFactura + clienteNombre + total);
    return `CUFE${timestamp}${hash}${random}`.substring(0, 40);
  };

  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  };

  const handleSubmitForm = async (values) => {
    try {
      const formData = {
        ...values,
        fecha_emision: values.fecha_emision.format('YYYY-MM-DD'),
        subtotal: parseFloat(values.subtotal) || 0,
        impuestos: parseFloat(values.impuestos) || 0,
        total: parseFloat(values.total) || 0,
        id_periodo: parseInt(values.id_periodo)
      };

      const estadosConCUFE = ['ENVIADA', 'ACEPTADA', 'RECHAZADA', 'ANULADA'];
      if (estadosConCUFE.includes(values.estado_fe) && (!values.cufe || values.cufe.trim() === '')) {
        formData.cufe = generarCUFE(
          values.numero_factura,
          formData.fecha_emision,
          values.cliente_nombre,
          formData.total
        );
      }

      if (editingFactura) {
        await facturacionService.actualizarFactura(editingFactura.id_factura_electronica, formData);
        message.success('Factura actualizada exitosamente');
      } else {
        await facturacionService.crearFactura(formData);
        message.success('Factura creada exitosamente');
      }

      setModalVisible(false);
      form.resetFields();
      cargarFacturas();
    } catch (error) {
      console.error('Error al guardar factura:', error);
      
      if (error.message.includes('FechaEmisionFueraDePeriodo')) {
        message.error(error.message);
      } else if (error.message.includes('PeriodoContableNotFound')) {
        message.error('El período contable seleccionado no existe');
      } else if (error.message.includes('total no coincide')) {
        message.error('El total no coincide con la suma de subtotal e impuestos');
      } else if (error.message.includes('Faltan datos requeridos')) {
        message.error('Faltan datos requeridos para crear la factura');
      } else {
        message.error(error.message || 'Error al guardar la factura');
      }
    }
  };

  const calcularTotal = () => {
    const subtotal = parseFloat(form.getFieldValue('subtotal')) || 0;
    const impuestos = parseFloat(form.getFieldValue('impuestos')) || 0;
    const total = subtotal + impuestos;
    form.setFieldValue('total', total);
  };

  const obtenerEstadoBadge = (estado) => {
    const clases = {
      'BORRADOR': 'estado-borrador',
      'ENVIADA': 'estado-enviada',
      'ACEPTADA': 'estado-aceptada',
      'RECHAZADA': 'estado-rechazada',
      'ANULADA': 'estado-anulada'
    };
    
    const textos = {
      'BORRADOR': 'Borrador',
      'ENVIADA': 'Enviada',
      'ACEPTADA': 'Aceptada',
      'RECHAZADA': 'Rechazada',
      'ANULADA': 'Anulada'
    };
    
    return (
      <span className={`estado-badge ${clases[estado] || 'estado-borrador'}`}>
        {textos[estado] || estado}
      </span>
    );
  };

  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    const inicio = moment(periodo.fecha_inicio).format('DD/MM/YYYY');
    const fin = moment(periodo.fecha_fin).format('DD/MM/YYYY');
    return `${inicio} - ${fin}`;
  };

  const facturasFiltradas = facturas.filter(factura => {
    if (filtroEstado && factura.estado_fe !== filtroEstado) {
      return false;
    }
    return true;
  });

  return (
    <div className="facturacion-page">
      <header className="page-header">
        <h1>Facturación Electrónica</h1>
        <Link to="/" className="back-link-header">
          <FaHome />
          <span>Volver al inicio</span>
        </Link>
      </header>

      <div className="facturacion-header">
        <div className="header-info">
          <h2>Gestión de Facturas Electrónicas</h2>
          <p>Administra y controla todas tus facturas electrónicas</p>
        </div>
        
        <div className="header-actions">
          <Select
            placeholder="Filtrar por estado"
            value={filtroEstado}
            onChange={setFiltroEstado}
            allowClear
            style={{ width: 170 }}
            suffixIcon={<FaFilter style={{ color: '#6b7280' }} />}
          >
            <Option value="BORRADOR">Borrador</Option>
            <Option value="ENVIADA">Enviada</Option>
            <Option value="ACEPTADA">Aceptada</Option>
            <Option value="RECHAZADA">Rechazada</Option>
            <Option value="ANULADA">Anulada</Option>
          </Select>

          <Button 
            icon={<BiRefresh />}
            onClick={cargarFacturas}
            className="btn-secondary"
          >
            Actualizar
          </Button>

          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={handleCrearFactura}
            className="btn-primary"
          >
            Nueva Factura
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <FaSpinner className="spinner-icon" />
          Cargando facturas...
        </div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="empty-state">
          <FaInbox className="icon" />
          <h3>No hay facturas</h3>
          <p>No se encontraron facturas con los filtros aplicados</p>
          <Button
            type="primary"
            size="large"
            icon={<FaFileInvoiceDollar />}
            onClick={handleCrearFactura}
            style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Crear Primera Factura
          </Button>
        </div>
      ) : (
        <div className="facturas-table-container">
          <table className="facturas-table">
            <thead>
              <tr>
                <th>No. Factura</th>
                <th>Cliente</th>
                <th>Período Contable</th>
                <th>Fecha Emisión</th>
                <th>Subtotal</th>
                <th>Impuestos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>CUFE</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasFiltradas.map((factura) => (
                <tr key={factura.id_factura_electronica}>
                  <td>{factura.numero_factura}</td>
                  <td>{factura.cliente_nombre}</td>
                  <td>
                    {factura.periodo_fecha_inicio && factura.periodo_fecha_fin 
                      ? `${moment(factura.periodo_fecha_inicio).format('DD/MM/YYYY')} - ${moment(factura.periodo_fecha_fin).format('DD/MM/YYYY')}`
                      : 'Sin período'
                    }
                  </td>
                  <td>{moment(factura.fecha_emision).format('DD/MM/YYYY')}</td>
                  <td className="currency">
                    {facturacionService.formatearMoneda(factura.subtotal)}
                  </td>
                  <td className="currency">
                    {facturacionService.formatearMoneda(factura.impuestos)}
                  </td>
                  <td className="currency">
                    {facturacionService.formatearMoneda(factura.total)}
                  </td>
                  <td>{obtenerEstadoBadge(factura.estado_fe)}</td>
                  <td>
                    <Tooltip title={factura.cufe || 'Sin CUFE'}>
                      <span>
                        {factura.cufe ? factura.cufe.substring(0, 8) + '...' : '-'}
                      </span>
                    </Tooltip>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Tooltip title="Ver detalles">
                        <button 
                          className="action-btn view"
                          onClick={() => handleVerDetalles(factura)}
                        >
                          <FaEye />
                        </button>
                      </Tooltip>
                      
                      <Tooltip title="Editar factura">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditarFactura(factura)}
                        >
                          <FaEdit />
                        </button>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar factura">
                        <Popconfirm
                          title="¿Estás seguro de eliminar esta factura?"
                          onConfirm={() => handleEliminarFactura(factura.id_factura_electronica)}
                          okText="Sí"
                          cancelText="No"
                        >
                          <button className="action-btn delete">
                            <FaTrash />
                          </button>
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={editingFactura ? 'Editar Factura' : 'Nueva Factura'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
        >
          <div className="form-row">
            <Form.Item
              name="id_periodo"
              label="Período Contable"
              rules={[{ required: true, message: 'Seleccione el período contable' }]}
            >
              <Select 
                placeholder="Seleccionar período"
                loading={loadingPeriodos}
                suffixIcon={<FaCalendarAlt />}
              >
                {periodos.map(periodo => (
                  <Option key={periodo.id_periodo} value={periodo.id_periodo}>
                    {formatearPeriodo(periodo)} - {periodo.estado}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="fecha_emision"
              label="Fecha de Emisión"
              rules={[{ required: true, message: 'Seleccione la fecha de emisión' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Seleccione fecha"
              />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              name="numero_factura"
              label="Número de Factura"
              rules={[{ required: true, message: 'Ingrese el número de factura' }]}
            >
              <Input placeholder="Ej: F001-00001" />
            </Form.Item>

            <Form.Item
              name="cliente_nombre"
              label="Nombre del Cliente"
              rules={[{ required: true, message: 'Ingrese el nombre del cliente' }]}
            >
              <Input placeholder="Nombre completo del cliente" />
            </Form.Item>
          </div>

          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Descripción de los productos o servicios facturados"
            />
          </Form.Item>

          <div className="form-row-3">
            <Form.Item
              name="subtotal"
              label="Subtotal"
              rules={[{ required: true, message: 'Ingrese el subtotal' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                onChange={calcularTotal}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="impuestos"
              label="Impuestos"
              rules={[{ required: true, message: 'Ingrese los impuestos' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                onChange={calcularTotal}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="total"
              label="Total"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                disabled
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              name="estado_fe"
              label="Estado"
              initialValue="BORRADOR"
            >
              <Select onChange={(valor) => {
                const estadosConCUFE = ['ENVIADA', 'ACEPTADA', 'RECHAZADA', 'ANULADA'];
                if (estadosConCUFE.includes(valor) && (!form.getFieldValue('cufe') || form.getFieldValue('cufe').trim() === '')) {
                  const numeroFactura = form.getFieldValue('numero_factura');
                  const fechaEmision = form.getFieldValue('fecha_emision');
                  const clienteNombre = form.getFieldValue('cliente_nombre');
                  const total = form.getFieldValue('total');
                  
                  if (numeroFactura && fechaEmision && clienteNombre && total) {
                    const cufeGenerado = generarCUFE(
                      numeroFactura,
                      fechaEmision.format('YYYY-MM-DD'),
                      clienteNombre,
                      total
                    );
                    form.setFieldValue('cufe', cufeGenerado);
                  }
                }
              }}>
                <Option value="BORRADOR">Borrador</Option>
                <Option value="ENVIADA">Enviada</Option>
                <Option value="ACEPTADA">Aceptada</Option>
                <Option value="RECHAZADA">Rechazada</Option>
                <Option value="ANULADA">Anulada</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="cufe"
              label="CUFE (Código Único de Facturación Electrónica)"
            >
              <Input 
                placeholder="Se genera automáticamente al enviar" 
                disabled={form.getFieldValue('estado_fe') !== 'BORRADOR'}
                style={{ 
                  backgroundColor: form.getFieldValue('estado_fe') !== 'BORRADOR' ? '#f5f5f5' : 'white',
                  color: form.getFieldValue('estado_fe') !== 'BORRADOR' ? '#666' : 'inherit'
                }}
              />
            </Form.Item>
          </div>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button 
              icon={<FaTimes />}
              onClick={() => setModalVisible(false)} 
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              icon={<FaSave />}
            >
              {editingFactura ? 'Actualizar' : 'Crear'} Factura
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Detalles de la Factura Electrónica"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {viewingFactura && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px 32px',
              fontSize: '14px'
            }}>
              <div>
                <strong style={{ color: '#374151' }}>Número de Factura:</strong>
                <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: '600' }}>
                  {viewingFactura.numero_factura}
                </div>
              </div>
              
              <div>
                <strong style={{ color: '#374151' }}>Estado:</strong>
                <div style={{ marginTop: '4px' }}>
                  {obtenerEstadoBadge(viewingFactura.estado_fe)}
                </div>
              </div>

              <div>
                <strong style={{ color: '#374151' }}>Período Contable:</strong>
                <div style={{ marginTop: '4px' }}>
                  {viewingFactura.periodo_fecha_inicio && viewingFactura.periodo_fecha_fin 
                    ? `${moment(viewingFactura.periodo_fecha_inicio).format('DD/MM/YYYY')} - ${moment(viewingFactura.periodo_fecha_fin).format('DD/MM/YYYY')}`
                    : 'Sin período'
                  }
                </div>
              </div>

              <div>
                <strong style={{ color: '#374151' }}>Fecha de Emisión:</strong>
                <div style={{ marginTop: '4px' }}>
                  {moment(viewingFactura.fecha_emision).format('DD/MM/YYYY')}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ color: '#374151' }}>Cliente:</strong>
                <div style={{ marginTop: '4px', fontSize: '16px' }}>
                  {viewingFactura.cliente_nombre}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ color: '#374151' }}>Descripción:</strong>
                <div style={{ 
                  marginTop: '4px', 
                  padding: '12px', 
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  minHeight: '60px'
                }}>
                  {viewingFactura.descripcion || 'Sin descripción'}
                </div>
              </div>

              <div>
                <strong style={{ color: '#374151' }}>Subtotal:</strong>
                <div style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                  {facturacionService.formatearMoneda(viewingFactura.subtotal)}
                </div>
              </div>

              <div>
                <strong style={{ color: '#374151' }}>Impuestos:</strong>
                <div style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                  {facturacionService.formatearMoneda(viewingFactura.impuestos)}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px 0', borderTop: '2px solid #e5e7eb' }}>
                <strong style={{ color: '#374151' }}>TOTAL:</strong>
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#1f2937'
                }}>
                  {facturacionService.formatearMoneda(viewingFactura.total)}
                </div>
              </div>

              {viewingFactura.cufe && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: '#374151' }}>CUFE:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    wordBreak: 'break-all'
                  }}>
                    {viewingFactura.cufe}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FacturacionPage;