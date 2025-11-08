import { BrowserRouter, Routes, Route } from "react-router-dom";
import TransaccionesPage from "./pages/TransaccionesPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/transacciones" element={<TransaccionesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
