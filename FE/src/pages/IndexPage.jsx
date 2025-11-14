import BalancePage from "./BalancePage";
import ReportesPage from "./ReportesPage";
import TransaccionesPage from "./TransaccionesPage";
import "./IndexPage.css";

export default function IndexPage() {
return (
    <div className="index-page">
        <div className="page-block">
            <h2>Transacciones</h2>
            <TransaccionesPage />
        </div>

        <div className="page-block">
            <h2>Balance</h2>
            <BalancePage />
        </div>

        <div className="page-block">
            <h2>Reportes</h2>
            <ReportesPage />
        </div>
    </div>
    
    );
}
