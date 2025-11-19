import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import TransaccionesPage from "./pages/TransaccionesPage";
import BalancePage from "./pages/BalancePage";
import ReportesPage from "./pages/ReportesPage";
import PeriodosPage  from "./pages/PeriodosPage";
import CuentasContablesPage from "./pages/CuentasContablesPage";
import FacturacionPage from "./pages/FacturacionPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/transacciones" element={<TransaccionesPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/periodos" element={<PeriodosPage />} />
        <Route path="/cuentas-contables" element={<CuentasContablesPage />} />
        <Route path="/facturacion" element={<FacturacionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
