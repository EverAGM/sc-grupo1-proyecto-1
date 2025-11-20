
BEGIN;

CREATE TABLE IF NOT EXISTS public.cuentas_contables
(
    id_cuenta serial NOT NULL,
    codigo character varying(20) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(100) COLLATE pg_catalog."default" NOT NULL,
    tipo character varying(20) COLLATE pg_catalog."default" NOT NULL,
    categoria character varying(50) COLLATE pg_catalog."default",
    padre_id integer,
    CONSTRAINT cuentas_contables_pkey PRIMARY KEY (id_cuenta),
    CONSTRAINT cuentas_contables_codigo_key UNIQUE (codigo)
);

CREATE TABLE IF NOT EXISTS public.facturas_electronicas
(
    id_factura_electronica serial NOT NULL,
    numero_factura character varying(50) COLLATE pg_catalog."default" NOT NULL,
    fecha_emision date NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now(),
    cliente_nombre character varying(200) COLLATE pg_catalog."default" NOT NULL,
    subtotal numeric(15, 4) NOT NULL,
    impuestos numeric(15, 4) DEFAULT 0,
    total numeric(15, 4) NOT NULL,
    estado_fe character varying(20) COLLATE pg_catalog."default" DEFAULT 'BORRADOR'::character varying,
    cufe character varying(100) COLLATE pg_catalog."default",
    descripcion text COLLATE pg_catalog."default",
    id_periodo integer,
    CONSTRAINT facturas_electronicas_pkey PRIMARY KEY (id_factura_electronica),
    CONSTRAINT facturas_electronicas_numero_factura_key UNIQUE (numero_factura)
);

CREATE TABLE IF NOT EXISTS public.partida_diaria
(
    id_partida_diaria serial NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    concepto text COLLATE pg_catalog."default",
    estado character varying(10) COLLATE pg_catalog."default" DEFAULT 'PENDIENTE'::character varying,
    id_periodo integer NOT NULL,
    CONSTRAINT partida_diaria_pkey PRIMARY KEY (id_partida_diaria)
);

CREATE TABLE IF NOT EXISTS public.periodos_contables
(
    id_periodo serial NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT periodos_contables_pkey PRIMARY KEY (id_periodo)
);

CREATE TABLE IF NOT EXISTS public.transacciones_contables
(
    id_transaccion serial NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cuenta_id integer NOT NULL,
    monto numeric(15, 4) NOT NULL,
    tipo_transaccion character varying(5) COLLATE pg_catalog."default" DEFAULT 'DEBE'::character varying,
    partida_diaria_id integer NOT NULL,
    fecha_operacion date,
    CONSTRAINT transacciones_contables_pkey PRIMARY KEY (id_transaccion)
);

-- Add foreign key constraints only if they don't exist
ALTER TABLE public.cuentas_contables DROP CONSTRAINT IF EXISTS fk_cuenta_padre;
ALTER TABLE public.cuentas_contables
    ADD CONSTRAINT fk_cuenta_padre FOREIGN KEY (padre_id)
    REFERENCES public.cuentas_contables (id_cuenta) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

ALTER TABLE public.facturas_electronicas DROP CONSTRAINT IF EXISTS facturas_electronicas_id_periodo_fkey;
ALTER TABLE public.facturas_electronicas
    ADD CONSTRAINT facturas_electronicas_id_periodo_fkey FOREIGN KEY (id_periodo)
    REFERENCES public.periodos_contables (id_periodo) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.partida_diaria DROP CONSTRAINT IF EXISTS fk_partida_diaria_periodo;
ALTER TABLE public.partida_diaria
    ADD CONSTRAINT fk_partida_diaria_periodo FOREIGN KEY (id_periodo)
    REFERENCES public.periodos_contables (id_periodo) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

ALTER TABLE public.transacciones_contables DROP CONSTRAINT IF EXISTS fk_transaccion_cuenta;
ALTER TABLE public.transacciones_contables
    ADD CONSTRAINT fk_transaccion_cuenta FOREIGN KEY (cuenta_id)
    REFERENCES public.cuentas_contables (id_cuenta) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_transacciones_cuenta
    ON public.transacciones_contables(cuenta_id);

ALTER TABLE public.transacciones_contables DROP CONSTRAINT IF EXISTS fk_transaccion_partida_diaria;
ALTER TABLE public.transacciones_contables
    ADD CONSTRAINT fk_transaccion_partida_diaria FOREIGN KEY (partida_diaria_id)
    REFERENCES public.partida_diaria (id_partida_diaria) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_transacciones_partida_diaria
    ON public.transacciones_contables(partida_diaria_id);

INSERT INTO periodos_contables (fecha_inicio, fecha_fin, estado) VALUES
('2024-01-01', '2024-12-31', 'ACTIVO'),
('2025-01-01', '2025-12-31', 'ACTIVO')
ON CONFLICT DO NOTHING;

INSERT INTO cuentas_contables (codigo, nombre, tipo, categoria, padre_id) VALUES
('1', 'ACTIVOS', 'ACTIVO', 'PRINCIPAL', NULL),
('1.1', 'ACTIVOS CORRIENTES', 'ACTIVO', 'GRUPO', 1),
('1.1.01', 'CAJA GENERAL', 'ACTIVO', 'DETALLE', 2),
('1.1.02', 'BANCO AGRICOLA', 'ACTIVO', 'DETALLE', 2),
('1.1.03', 'CUENTAS POR COBRAR', 'ACTIVO', 'DETALLE', 2),
('1.1.04', 'INVENTARIOS', 'ACTIVO', 'DETALLE', 2),
('2', 'PASIVOS', 'PASIVO', 'PRINCIPAL', NULL),
('2.1', 'PASIVOS CORRIENTES', 'PASIVO', 'GRUPO', 7),
('2.1.01', 'PROVEEDORES', 'PASIVO', 'DETALLE', 8),
('2.1.02', 'PRESTAMOS BANCARIOS', 'PASIVO', 'DETALLE', 8),
('3', 'PATRIMONIO', 'PATRIMONIO', 'PRINCIPAL', NULL),
('3.1.01', 'CAPITAL SOCIAL', 'PATRIMONIO', 'DETALLE', 11),
('4', 'INGRESOS', 'INGRESO', 'PRINCIPAL', NULL),
('4.1.01', 'VENTAS LOCALES', 'INGRESO', 'DETALLE', 13),
('4.1.02', 'INGRESOS SERVICIOS', 'INGRESO', 'DETALLE', 13),
('5', 'GASTOS', 'GASTO', 'PRINCIPAL', NULL),
('5.1.01', 'GASTOS ADMINISTRATIVOS', 'GASTO', 'DETALLE', 16),
('5.1.02', 'GASTOS DE VENTAS', 'GASTO', 'DETALLE', 16)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO partida_diaria (concepto, estado, id_periodo) VALUES
('Venta de mercaderia del dia', 'PROCESADO', 1),
('Compra de inventario', 'PROCESADO', 1),
('Pago de salarios administrativos', 'PROCESADO', 1),
('Cobro servicios bancarios', 'PENDIENTE', 1)
ON CONFLICT DO NOTHING;

INSERT INTO transacciones_contables (cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion) VALUES
(3, 15000.00, 'DEBE', 1, '2024-11-15'),
(14, 15000.00, 'HABER', 1, '2024-11-15'),
(4, 8500.00, 'DEBE', 2, '2024-11-16'),
(9, 8500.00, 'HABER', 2, '2024-11-16'),
(17, 3200.00, 'DEBE', 3, '2024-11-17'),
(3, 3200.00, 'HABER', 3, '2024-11-17'),
(18, 450.00, 'DEBE', 4, '2024-11-18'),
(4, 450.00, 'HABER', 4, '2024-11-18')
ON CONFLICT DO NOTHING;

INSERT INTO facturas_electronicas (numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, descripcion, id_periodo) VALUES
('FE001-2024', '2024-11-15', 'Distribuidora El Salvador S.A.', 13274.34, 1991.15, 15265.49, 'PROCESADO', 'Venta de productos textiles', 1),
('FE002-2024', '2024-11-16', 'Hospital Nacional Bloom', 7079.65, 1061.95, 8141.60, 'PROCESADO', 'Suministro uniformes medicos', 1),
('FE003-2024', '2024-11-17', 'Universidad Centroamericana', 4424.78, 663.72, 5088.50, 'PENDIENTE', 'Uniformes estudiantes', 1)
ON CONFLICT (numero_factura) DO NOTHING;

END;


