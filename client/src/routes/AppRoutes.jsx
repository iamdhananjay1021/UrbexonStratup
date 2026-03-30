import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PageTransition from "../components/PageTransition";
import MainLayout from "../layouts/MainLayout";
import VendorRoute from "../components/VendorRoute";

// ── Eagerly loaded (critical path)
import Login from "../pages/Login";
import Home from "../pages/Home";   // ✅ actual filename: Home.jsx

// ── Lazy loaded
const Register = lazy(() => import("../pages/Register"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../components/checkout/Checkout"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const OrderDetails = lazy(() => import("../pages/OrderDetails"));
const OrderSuccess = lazy(() => import("../pages/OrderSuccess"));
const ProductDetails = lazy(() => import("../components/ProductDetails"));
const Profile = lazy(() => import("../pages/Profile"));
const ForgotPassword = lazy(() => import("../pages/Forgotpassword"));
const ResetPassword = lazy(() => import("../pages/Resetpassword"));
const VerifyInvoice = lazy(() => import("../pages/Verifyinvoice"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const RefundPolicy = lazy(() => import("../pages/RefundPolicy"));
const ContactUs = lazy(() => import("../pages/Contactus"));
const CategoryPage = lazy(() => import("../pages/Categorypage"));  // ✅ actual filename: Categorypage.jsx
const DealsPage = lazy(() => import("../pages/Dealspage"));     // ✅ actual filename: Dealspage.jsx
const NotFound = lazy(() => import("../pages/Notfound"));      // ✅ actual filename: Notfound.jsx
const VendorLayout = lazy(() => import("../components/vendor/VendorLayout"));
const VendorApply = lazy(() => import("../pages/vendor/VendorApply"));
const VendorStatus = lazy(() => import("../pages/vendor/VendorStatus"));
const VendorDashboard = lazy(() => import("../pages/vendor/VendorDashboard"));
const VendorEarnings = lazy(() => import("../pages/vendor/VendorEarnings"));
const VendorProfile = lazy(() => import("../pages/vendor/VendorProfile"));

/* ── Page loader ── */
const PageLoader = () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f4ee" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e8e4d9", borderTop: "3px solid #c9a84c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

/* ── Scroll to top on route change ── */
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
};

/* ════════════════════════════════════════
   APP ROUTES
════════════════════════════════════════ */
const AppRoutes = () => {
    return (
        <>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
                <Routes>

                    {/* ── No navbar/footer routes ── */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/order-success/:id" element={<OrderSuccess />} />

                    {/* ── Checkout: protected, no layout ── */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/checkout" element={<Checkout />} />
                    </Route>

                    {/* ── Main layout (navbar + footer) ── */}
                    <Route element={<MainLayout />}>

                        <Route path="/" element={
                            <PageTransition><Home /></PageTransition>
                        } />

                        <Route path="/category/:slug" element={
                            <PageTransition><CategoryPage /></PageTransition>
                        } />

                        <Route path="/deals" element={
                            <PageTransition><DealsPage /></PageTransition>
                        } />

                        <Route path="/products/:id" element={
                            <PageTransition><ProductDetails /></PageTransition>
                        } />

                        {/* Static pages */}
                        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                        <Route path="/terms-conditions" element={<PageTransition><TermsConditions /></PageTransition>} />
                        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
                        <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />
                        <Route path="/verify-invoice" element={<PageTransition><VerifyInvoice /></PageTransition>} />

                        {/* Protected routes inside layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/orders" element={<MyOrders />} />
                            <Route path="/orders/:id" element={<OrderDetails />} />
                            <Route path="/profile" element={<Profile />} />
                        </Route>

                    </Route>


                    {/* ── Vendor portal ── */}
                    <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
                        <Route element={<VendorRoute />}>
                            <Route path="/vendor" element={<VendorLayout />}>
                                <Route index element={<VendorStatus />} />
                                <Route path="status" element={<VendorStatus />} />
                                <Route path="apply" element={<VendorApply />} />
                                <Route path="dashboard" element={<VendorDashboard />} />
                                <Route path="earnings" element={<VendorEarnings />} />
                                <Route path="profile" element={<VendorProfile />} />
                            </Route>
                        </Route>
                    </Route>
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />

                </Routes>
            </Suspense>
        </>
    );
};

export default AppRoutes;