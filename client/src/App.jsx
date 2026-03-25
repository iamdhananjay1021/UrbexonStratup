// src/App.jsx

import { BrowserRouter as Router } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";

const AppRoutes = lazy(() => import("./routes/AppRoutes"));

export default function App() {
  return (
    <Router>
      <AuthProvider>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen text-lg">
              Loading...
            </div>
          }
        >
          <AppRoutes />
        </Suspense>

      </AuthProvider>
    </Router>
  );
}