import { Toast, useToast } from "./components/Toast";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrowserRouter as Router } from "react-router-dom";
import { AdminAuthProvider } from "./auth/AdminAuthContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
    const { toast, showToast } = useToast();
    useEffect(() => {
        const h = (e) => showToast(e.detail.message, e.detail.type || "error");
        window.addEventListener("api:error", h);
        return () => window.removeEventListener("api:error", h);
    }, [showToast]);
    return (
        <><ErrorBoundary>
            <Router>
                <AdminAuthProvider>
                    <AppRoutes />
                </AdminAuthProvider>
            </Router>
        </ErrorBoundary><Toast toast={toast} /></>
    );
}

export default App;