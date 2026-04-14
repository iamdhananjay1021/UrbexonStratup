import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
    return (
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#f7f4ee" }}>
            <Navbar />
            <main style={{ flex:1 }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
