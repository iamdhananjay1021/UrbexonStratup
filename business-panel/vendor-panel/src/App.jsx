import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <AuthProvider>
                    <NotificationProvider>
                        <AppRoutes />
                    </NotificationProvider>
                </AuthProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}