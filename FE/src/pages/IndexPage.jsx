import { useNavigate } from "react-router-dom";
import "./IndexPage.css";
import BalancePage from "./BalancePage.jsx";
import ReportesPage from "./ReportesPage.jsx";

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
        </div>
    );
}
