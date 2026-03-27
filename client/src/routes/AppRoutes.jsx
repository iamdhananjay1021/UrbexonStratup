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
// const NotFound = lazy(() => import("../pages/NotFound")); // ✅ Add this page

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

                <Routes>

                    {/* ============================= */}
                    {/* ❌ NO NAVBAR / FOOTER ROUTES */}
                    {/* ============================= */}

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* ✅ Checkout (Protected + Clean UI) */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/checkout" element={<Checkout />} />
                    </Route>

                    {/* ✅ Order Success (no distractions) */}
                    <Route path="/order-success/:id" element={<OrderSuccess />} />


                    {/* ============================= */}
                    {/* ✅ WITH NAVBAR + FOOTER */}
                    {/* ============================= */}

                    <Route element={<MainLayout />}>

                        {/* Wrap only main pages in transition */}
                        <Route
                            path="/"
                            element={
                                <PageTransition>
                                    <Home />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/products/:id"
                            element={
                                <PageTransition>
                                    <ProductDetails />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/privacy-policy"
                            element={
                                <PageTransition>
                                    <PrivacyPolicy />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/terms-conditions"
                            element={
                                <PageTransition>
                                    <TermsConditions />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/refund-policy"
                            element={
                                <PageTransition>
                                    <RefundPolicy />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/contact"
                            element={
                                <PageTransition>
                                    <ContactUs />
                                </PageTransition>
                            }
                        />

                        {/* 🔒 Protected inside layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/orders" element={<MyOrders />} />
                            <Route path="/orders/:id" element={<OrderDetails />} />
                            <Route path="/profile" element={<Profile />} />
                        </Route>

                    </Route>

                    {/* ============================= */}
                    {/* ❌ 404 PAGE */}
                    {/* ============================= */}
                    {/* <Route path="*" element={<NotFound />} /> */}

                </Routes>

            </Suspense>
        </>
    );
};

export default AppRoutes;