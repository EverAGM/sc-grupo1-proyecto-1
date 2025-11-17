import { useNavigate } from "react-router-dom";
import "./IndexPage.css";
import BalancePage from "./BalancePage.jsx";
import ReportesPage from "./ReportesPage.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ContaCorpDashboard() {
    const navigate = useNavigate();

    return (
        <div className="cc-layout">

        <header className="cc-header">
            <h1 className="cc-logo">ContaCorp</h1>
        </header>

        <nav className="cc-nav">
            <button
            className="cc-nav-btn"
            onClick={() => navigate("/cuentas-contables")}
            >
            Cuentas contables
            </button>
            <button
            className="cc-nav-btn"
            onClick={() => navigate("/transacciones")}
            >
            Transacciones
            </button>
            <button
            className="cc-nav-btn"
            onClick={() => navigate("/periodos")}
            >
            Periodos
            </button>
            <button
            className="cc-nav-btn cc-nav-btn-highlight"
            onClick={() => navigate("/facturacion")}
            >
            Facturación Electrónica
            </button>
        </nav>

        <main className="cc-main">
            <section className="cc-grid">
            <article className="cc-card">
                <BalancePage />
            </article>

            <article className="cc-card">
                <ReportesPage />
            </article>
            </section>
        </main>
        
        {/* Contenedor para las notificaciones toast */}
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