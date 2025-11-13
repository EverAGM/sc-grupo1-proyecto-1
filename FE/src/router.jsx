import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TransaccionesPage from "./pages/TransaccionesPage";
import BalancePage from "./pages/BalancePage";
import ReportesPage from "./pages/ReportesPage";
import PeriodosPage  from "./pages/PeriodosPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/transacciones" replace />} />
        <Route path="/transacciones" element={<TransaccionesPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/periodos" element={<PeriodosPage />} />
      </Routes>
    </BrowserRouter>
  );
}
