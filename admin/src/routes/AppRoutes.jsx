import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import AdminForgotPassword from "../pages/AdminForgotPassword";
import AdminResetPassword from "../pages/AdminResetPassword";
import Admin from "../pages/Admin";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProducts from "../pages/AdminProducts";
import AdminAddProduct from "../pages/AdminAddProduct";
import AdminEditProduct from "../pages/AdminEditProduct";
import AdminOrders from "../pages/AdminOrders";
import AdminBanners from "../pages/AdminBanners";
import AdminAddBanner from "../pages/Adminaddbanner";
import AdminEditBanner from "../pages/Admineditbanner";
import AdminCategories from "../pages/Admincategories";
import AdminAddCategory from "../pages/Adminaddcategory";
import AdminEditCategory from "../pages/Admineditcategory";

// ── Vendor Module ──────────────────────────────────────────
import AdminVendors from "../pages/AdminVendors";
import AdminVendorDetail from "../pages/AdminVendorDetail";
import AdminPincodes from "../pages/AdminPincodes";
import AdminSettlements from "../pages/AdminSettlements";

// ── Refund & Returns ───────────────────────────────────────
import AdminRefundReturn from "../pages/AdminRefundReturn";

import AdminRoute from "./AdminRoute";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />

            <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />}>
                    <Route index element={<AdminDashboard />} />

                    {/* Products */}
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminAddProduct />} />
                    <Route path="products/:id/edit" element={<AdminEditProduct />} />

                    {/* Orders */}
                    <Route path="orders" element={<AdminOrders />} />

                    {/* Banners */}
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="banners/new" element={<AdminAddBanner />} />
                    <Route path="banners/:id/edit" element={<AdminEditBanner />} />

                    {/* Categories */}
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="categories/new" element={<AdminAddCategory />} />
                    <Route path="categories/:id/edit" element={<AdminEditCategory />} />

                    {/* Vendors */}
                    <Route path="vendors" element={<AdminVendors />} />
                    <Route path="vendors/:id" element={<AdminVendorDetail />} />

                    {/* Pincodes */}
                    <Route path="pincodes" element={<AdminPincodes />} />

                    {/* Settlements */}
                    <Route path="settlements" element={<AdminSettlements />} />

                    {/* Refunds & Returns */}
                    <Route path="refunds" element={<AdminRefundReturn />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;