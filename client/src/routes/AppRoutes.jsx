import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PageTransition from "../components/PageTransition";

// ✅ Layout
import MainLayout from "../layouts/MainLayout";

// Eagerly loaded
import Home from "../pages/Home";
import Login from "../pages/Login";

// Lazy loaded
const Register = lazy(() => import("../pages/Register"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
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


// 🔄 Loader
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
);


// 🔝 Scroll Fix
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};


const AppRoutes = () => {
    return (
        <>
            <ScrollToTop />

            <Suspense fallback={<PageLoader />}>
                <PageTransition>

                    <Routes>

                        {/* ❌ WITHOUT Navbar/Footer (Auth Pages) */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />

                        {/* ✅ WITH Navbar + Footer */}
                        <Route element={<MainLayout />}>

                            <Route path="/" element={<Home />} />
                            <Route path="/products/:id" element={<ProductDetails />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-conditions" element={<TermsConditions />} />
                            <Route path="/refund-policy" element={<RefundPolicy />} />
                            <Route path="/contact" element={<ContactUs />} />

                            {/* Protected */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/orders" element={<MyOrders />} />
                                <Route path="/orders/:id" element={<OrderDetails />} />
                                <Route path="/order-success/:id" element={<OrderSuccess />} />
                                <Route path="/profile" element={<Profile />} />
                            </Route>

                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />

                    </Routes>

                </PageTransition>
            </Suspense>
        </>
    );
};

export default AppRoutes;