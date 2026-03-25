import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import {
    FaArrowLeft, FaShieldAlt, FaTruck, FaCheckCircle,
    FaWhatsapp, FaUser, FaMapMarkerAlt, FaClipboardList,
    FaPencilAlt, FaCreditCard, FaLock, FaRedo, FaMoneyBillWave,
    FaImage, FaLocationArrow, FaSpinner, FaTimesCircle,
    FaBookmark, FaPlus, FaEdit, FaTrash,
    FaHome, FaBriefcase, FaTag,
} from "react-icons/fa";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PLATFORM_FEE = 0;
const FREE_DELIVERY_ABOVE = 1;
const COD_DELIVERY_CHARGE = 0;
const ONLINE_DELIVERY_CHARGE = 0;
const SHOP_LAT = 26.41922;
const SHOP_LNG = 82.53598;
const COD_RADIUS_KM = 15;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });

const serializeItems = (items) =>
    items.map((item) => ({
        productId: item.productId || item._id,
        name: item.name,
        price: item.price,
        qty: item.quantity || item.qty || 1,
        image: typeof item.image === "string" ? item.image : item.images?.[0]?.url || "",
        customization: {
            text: item.customization?.text?.trim() || "",
            imageUrl: item.customization?.imageUrl?.trim() || "",
            note: item.customization?.note?.trim() || "",
        },
        selectedSize: item.selectedSize || "",
    }));

const emptyForm = () => ({
    label: "Home", name: "", phone: "", house: "",
    area: "", landmark: "", city: "", state: "", pincode: "",
    lat: null, lng: null,
});

/* ─────────────────────────────────────────
   LABEL CONFIG
───────────────────────────────────────── */
const LABEL_ICONS = {
    Home: <FaHome size={10} />,
    Work: <FaBriefcase size={10} />,
    Other: <FaMapMarkerAlt size={10} />,
};

/* ─────────────────────────────────────────
   ADDRESS FORM
───────────────────────────────────────── */
const AddressForm = memo(({ initial = emptyForm(), onSave, onCancel, saving }) => {
    const [form, setForm] = useState(initial);
    const [pincodeMsg, setPincodeMsg] = useState({ text: "", ok: null });
    const [pincodeLoad, setPincodeLoad] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsMsg, setGpsMsg] = useState("");
    const [formError, setFormError] = useState("");
    const pincodeTimer = useRef(null);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setFormError("");
        if (name === "pincode") {
            setPincodeMsg({ text: "", ok: null });
            clearTimeout(pincodeTimer.current);
            if (/^\d{6}$/.test(value))
                pincodeTimer.current = setTimeout(() => checkPincode(value), 400);
        }
    }, []);

    const checkPincode = useCallback(async (pin) => {
        try {
            setPincodeLoad(true);
            const { data } = await api.get(`/addresses/pincode/${pin}`);
            setForm(f => ({ ...f, city: data.city, state: data.state, lat: data.lat || null, lng: data.lng || null }));
            setPincodeMsg({ text: `✓ ${data.city}, ${data.state}`, ok: true });
        } catch (err) {
            setPincodeMsg({ text: err.response?.data?.message || "Invalid pincode", ok: false });
        } finally { setPincodeLoad(false); }
    }, []);

    const handleGPS = useCallback(() => {
        if (!navigator.geolocation) { setGpsMsg("Location not supported"); return; }
        setGpsLoading(true); setGpsMsg("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        { headers: { "User-Agent": "UrbeXon/2.0" } }
                    );
                    const data = await res.json();
                    const addr = data.address || {};
                    const pin = addr.postcode || "";
                    setForm(f => ({
                        ...f,
                        area: addr.suburb || addr.neighbourhood || addr.road || f.area,
                        city: addr.city || addr.town || addr.village || f.city,
                        state: addr.state || f.state,
                        pincode: pin || f.pincode,
                        lat: latitude, lng: longitude,
                    }));
                    setGpsMsg(`📍 ${addr.city || addr.town || "Location"} detected`);
                    if (/^\d{6}$/.test(pin)) checkPincode(pin);
                } catch { setGpsMsg("Could not fetch address"); }
                setGpsLoading(false);
            },
            () => { setGpsMsg("Location permission denied"); setGpsLoading(false); },
            { timeout: 10000 }
        );
    }, [checkPincode]);

    const handleSubmit = useCallback(() => {
        if (!form.name.trim()) return setFormError("Name is required");
        if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setFormError("Enter valid 10-digit mobile");
        if (!form.house.trim()) return setFormError("House / Flat is required");
        if (!form.area.trim()) return setFormError("Area / Street is required");
        if (!/^\d{6}$/.test(form.pincode.trim())) return setFormError("Enter valid 6-digit pincode");
        if (!form.city.trim() || !form.state.trim()) return setFormError("City and State are required");
        onSave(form);
    }, [form, onSave]);

    return (
        <div className="uk-af-root">
            {/* Label Row */}
            <div className="uk-af-label-row">
                {["Home", "Work", "Other"].map(l => (
                    <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                        className={`uk-af-label-btn${form.label === l ? " active" : ""}`}>
                        {LABEL_ICONS[l]} {l}
                    </button>
                ))}
                <button onClick={handleGPS} disabled={gpsLoading} type="button" className="uk-af-gps-btn">
                    {gpsLoading ? <><FaSpinner size={9} className="uk-spin" /> Detecting…</> : <><FaLocationArrow size={9} /> GPS</>}
                </button>
            </div>

            {gpsMsg && <p className={`uk-af-gps-msg${gpsMsg.startsWith("📍") ? " ok" : " err"}`}>{gpsMsg}</p>}

            <div className="uk-af-grid-2">
                <div>
                    <label className="uk-af-label-text">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Verma" className="uk-af-input" />
                </div>
                <div>
                    <label className="uk-af-label-text">Mobile *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit" maxLength={10} className="uk-af-input" />
                </div>
            </div>

            <div>
                <label className="uk-af-label-text">House / Flat *</label>
                <input name="house" value={form.house} onChange={handleChange} placeholder="e.g. 42, 3rd Floor" className="uk-af-input" />
            </div>
            <div>
                <label className="uk-af-label-text">Area / Street *</label>
                <input name="area" value={form.area} onChange={handleChange} placeholder="e.g. MG Road" className="uk-af-input" />
            </div>
            <div>
                <label className="uk-af-label-text">Landmark <span className="uk-af-optional">Optional</span></label>
                <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" className="uk-af-input" />
            </div>

            <div>
                <label className="uk-af-label-text">
                    Pincode *
                    {pincodeLoad && <FaSpinner size={9} className="uk-spin" style={{ marginLeft: 6, color: "var(--uk-accent)" }} />}
                </label>
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6}
                    className={`uk-af-input${pincodeMsg.ok === true ? " pin-ok" : pincodeMsg.ok === false ? " pin-err" : ""}`} />
                {pincodeMsg.text && (
                    <p className={`uk-af-pin-msg${pincodeMsg.ok ? " ok" : " err"}`}>
                        {pincodeMsg.ok ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />}
                        {pincodeMsg.text}
                    </p>
                )}
            </div>

            <div className="uk-af-grid-2">
                <div>
                    <label className="uk-af-label-text">City *</label>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Auto-filled" className="uk-af-input" />
                </div>
                <div>
                    <label className="uk-af-label-text">State *</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Auto-filled" className="uk-af-input" />
                </div>
            </div>

            {formError && <p className="uk-af-error">{formError}</p>}

            <div className="uk-af-actions">
                <button onClick={handleSubmit} disabled={saving} className="uk-af-save-btn">
                    {saving ? <><FaSpinner size={12} className="uk-spin" /> Saving…</> : <><FaBookmark size={11} /> Save Address</>}
                </button>
                <button onClick={onCancel} className="uk-af-cancel-btn">Cancel</button>
            </div>
        </div>
    );
});
AddressForm.displayName = "AddressForm";

/* ═══════════════════════════════════════════
   CHECKOUT — MAIN
═══════════════════════════════════════════ */
const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { cartItems, totalPrice, clear } = useCart();

    const buyNowItem = location.state?.buyNowItem || null;
    const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;
    const itemsTotal = buyNowItem ? buyNowItem.price * (buyNowItem.quantity || 1) : totalPrice;

    const [paymentMethod, setPaymentMethod] = useState("");
    const deliveryCharge = paymentMethod === "cod" ? COD_DELIVERY_CHARGE
        : itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : ONLINE_DELIVERY_CHARGE;
    const isFreeDelivery = deliveryCharge === 0;
    const amountForFree = paymentMethod !== "cod" && itemsTotal < FREE_DELIVERY_ABOVE
        ? FREE_DELIVERY_ABOVE - itemsTotal : 0;
    const finalTotal = itemsTotal + PLATFORM_FEE + deliveryCharge;

    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [payState, setPayState] = useState("idle");

    const [contact, setContact] = useState({ name: user?.name || "", phone: "", email: user?.email || "" });

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [addrLoading, setAddrLoading] = useState(false);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddr, setEditingAddr] = useState(null);
    const [savingAddr, setSavingAddr] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [codAllowed, setCodAllowed] = useState(null);
    const [codDistance, setCodDistance] = useState(null);
    const [codChecking, setCodChecking] = useState(false);

    const fetchAddresses = useCallback(async () => {
        try {
            setAddrLoading(true);
            const { data } = await api.get("/addresses");
            const addresses = Array.isArray(data) ? data : [];
            setSavedAddresses(addresses);
            const def = addresses.find(a => a.isDefault);
            if (def) setSelectedAddrId(def._id);
            else if (addresses.length) setSelectedAddrId(addresses[0]._id);
        } catch { /* silent */ }
        finally { setAddrLoading(false); }
    }, []);

    useEffect(() => {
        if (checkoutItems.length === 0) navigate("/");
        if (user) fetchAddresses();
    }, []); // eslint-disable-line

    const selectedAddress = savedAddresses.find(a => a._id === selectedAddrId);

    useEffect(() => {
        const checkCOD = async () => {
            if (step !== 3) return;
            if (!selectedAddress?.pincode) { setCodAllowed(false); return; }
            try {
                setCodChecking(true);
                const { data } = await api.get(`/addresses/pincode/${selectedAddress.pincode}`);
                setCodAllowed(data.codAllowed === true);
                const lat = data.lat || selectedAddress.lat;
                const lng = data.lng || selectedAddress.lng;
                if (lat && lng) {
                    setCodDistance(getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng));
                    if (!selectedAddress.lat && !selectedAddress.lng)
                        api.put(`/addresses/${selectedAddress._id}`, { lat, lng }).catch(() => { });
                } else setCodDistance(null);
            } catch { setCodAllowed(false); setCodDistance(null); }
            finally { setCodChecking(false); }
        };
        checkCOD();
    }, [selectedAddress?._id, step]);

    const codAvailable = codAllowed === true;

    const getAddress = useCallback(() => {
        if (!selectedAddress) return "";
        const { house, area, landmark, city, state, pincode } = selectedAddress;
        return `${house}, ${area},${landmark ? " " + landmark + "," : ""} ${city}, ${state} - ${pincode}`;
    }, [selectedAddress]);

    const handleAddAddress = useCallback(async (form) => {
        try {
            setSavingAddr(true);
            const { data } = await api.post("/addresses", { ...form, isDefault: savedAddresses.length === 0 });
            setSavedAddresses(data.addresses);
            setSelectedAddrId(data.addresses[data.addresses.length - 1]._id);
            setShowAddForm(false);
        } catch (err) { alert(err.response?.data?.message || "Failed to save address"); }
        finally { setSavingAddr(false); }
    }, [savedAddresses.length]);

    const handleEditAddress = useCallback(async (form) => {
        try {
            setSavingAddr(true);
            const { data } = await api.put(`/addresses/${editingAddr._id}`, form);
            setSavedAddresses(data.addresses);
            setEditingAddr(null);
        } catch (err) { alert(err.response?.data?.message || "Failed to update address"); }
        finally { setSavingAddr(false); }
    }, [editingAddr?._id]);

    const handleDeleteAddress = useCallback(async (id) => {
        try {
            const { data } = await api.delete(`/addresses/${id}`);
            setSavedAddresses(data.addresses);
            if (selectedAddrId === id) {
                const def = data.addresses.find(a => a.isDefault);
                setSelectedAddrId(def?._id || data.addresses[0]?._id || null);
            }
            setDeleteConfirmId(null);
        } catch { alert("Failed to delete address"); }
    }, [selectedAddrId]);

    const handleSetDefault = useCallback(async (id) => {
        try {
            const { data } = await api.put(`/addresses/${id}/default`);
            setSavedAddresses(data.addresses);
        } catch { /* silent */ }
    }, []);

    const handleContactContinue = useCallback(() => {
        if (!contact.name.trim()) return setError("Please enter your full name");
        if (!/^[6-9]\d{9}$/.test(contact.phone.trim())) return setError("Enter valid 10-digit mobile number");
        setError(""); setStep(2);
    }, [contact]);

    const handleAddressContinue = useCallback(() => {
        if (!selectedAddress) return setError("Please select or add a delivery address");
        if (paymentMethod === "cod" && !codAvailable) setPaymentMethod("");
        setError(""); setStep(3);
    }, [selectedAddress, paymentMethod, codAvailable]);

    const handleCOD = useCallback(async () => {
        try {
            setLoading(true); setError("");
            const { data } = await api.post("/orders", {
                items: serializeItems(checkoutItems),
                customerName: contact.name,
                phone: selectedAddress?.phone || contact.phone,
                email: contact.email || `${contact.phone}@UrbeXon.com`,
                address: getAddress(),
                pincode: selectedAddress?.pincode || "",
                totalAmount: finalTotal,
                platformFee: PLATFORM_FEE,
                deliveryCharge,
                paymentMethod: "COD",
            });
            if (!buyNowItem) clear();
            const itemLines = serializeItems(checkoutItems)
                .map((i, idx) => `  ${idx + 1}. ${i.name} x${i.qty} — Rs.${(i.price * i.qty).toLocaleString("en-IN")}`)
                .join("\n");
            let msg = `🛒 *New COD Order - UrbeXon*\n━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🔖 *Order ID:* #${data.orderId.toString().slice(-6).toUpperCase()}\n\n`;
            msg += `👤 *Name:* ${contact.name}\n📞 *Mobile:* ${selectedAddress?.phone || contact.phone}\n📧 *Email:* ${contact.email || "Not provided"}\n\n`;
            msg += `📍 *Delivery Address:*\n  ${selectedAddress?.house}, ${selectedAddress?.area},\n`;
            if (selectedAddress?.landmark) msg += `  ${selectedAddress.landmark},\n`;
            msg += `  ${selectedAddress?.city}, ${selectedAddress?.state}\n  📮 Pincode: ${selectedAddress?.pincode}\n\n`;
            msg += `🛍️ *Items:*\n${itemLines}\n\n━━━━━━━━━━━━━━━━━━━\n`;
            msg += `💰 *Payment:* Cash on Delivery\n🚚 *Delivery:* Rs.${deliveryCharge}\n💵 *Total:* Rs.${finalTotal.toLocaleString("en-IN")}`;
            window.open(`https://wa.me/918299519532?text=${encodeURIComponent(msg)}`, "_blank");
            navigate(`/order-success/${data.orderId}`, { replace: true, state: { paymentMethod: "COD" } });
        } catch (err) { setError(err.response?.data?.message || "Order placement failed. Please try again."); }
        finally { setLoading(false); }
    }, [checkoutItems, contact, selectedAddress, finalTotal, deliveryCharge, buyNowItem, clear, getAddress, navigate]);

    const handlePayWithRazorpay = useCallback(async () => {
        try {
            setLoading(true); setError(""); setPayState("processing");
            const loaded = await loadRazorpay();
            if (!loaded) { setError("Payment gateway failed to load."); setPayState("failed"); setLoading(false); return; }
            const { data: rpOrder } = await api.post("/payment/create-order", { amount: finalTotal, receipt: `order_${Date.now()}` });
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: rpOrder.amount, currency: rpOrder.currency,
                name: "UrbeXon",
                description: `Order — ${checkoutItems.length} item(s)`,
                order_id: rpOrder.id,
                prefill: { name: contact.name, email: contact.email || "", contact: `+91${contact.phone}` },
                theme: { color: "#c8a96e" },
                handler: async (response) => {
                    try {
                        setPayState("processing");
                        const { data } = await api.post("/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderData: {
                                items: serializeItems(checkoutItems),
                                customerName: contact.name,
                                phone: selectedAddress?.phone || contact.phone,
                                email: contact.email || `${contact.phone}@UrbeXon.com`,
                                address: getAddress(),
                                totalAmount: finalTotal,
                                platformFee: PLATFORM_FEE,
                                deliveryCharge,
                            },
                        });
                        if (data.success) {
                            setPayState("success");
                            if (!buyNowItem) clear();
                            navigate(`/order-success/${data.orderId}`, { replace: true, state: { paymentId: data.paymentId } });
                        }
                    } catch (err) {
                        setPayState("failed");
                        setError("Payment done but order failed. Contact support with Payment ID: " + response.razorpay_payment_id);
                    } finally { setLoading(false); }
                },
                modal: { ondismiss: () => { setPayState("failed"); setLoading(false); setError("Payment cancelled. You can retry."); } },
            };
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (r) => { setPayState("failed"); setLoading(false); setError(`Payment failed: ${r.error.description}`); });
            rzp.open();
        } catch (err) {
            setPayState("failed");
            setError(err.response?.data?.message || "Payment initialization failed. Please try again.");
            setLoading(false);
        }
    }, [checkoutItems, contact, selectedAddress, finalTotal, deliveryCharge, buyNowItem, clear, getAddress, navigate]);

    const STEPS = [
        { id: 1, label: "Contact", icon: <FaUser size={11} /> },
        { id: 2, label: "Address", icon: <FaMapMarkerAlt size={11} /> },
        { id: 3, label: "Payment", icon: <FaCreditCard size={11} /> },
    ];

    /* ─────────────────────────────────────────
       RENDER
    ───────────────────────────────────────── */
    return (
        <div className="uk-co-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600;700;800&display=swap');

                :root {
                    --uk-bg: #f5f2ec;
                    --uk-surface: #ffffff;
                    --uk-ink: #1c1917;
                    --uk-ink-muted: #78716c;
                    --uk-ink-faint: #a8a29e;
                    --uk-border: #e7e5e1;
                    --uk-accent: #c8a96e;
                    --uk-accent-dark: #a8894e;
                    --uk-accent-bg: #fdf6ea;
                    --uk-green: #059669;
                    --uk-green-bg: #ecfdf5;
                    --uk-red: #dc2626;
                    --uk-red-bg: #fef2f2;
                    --uk-blue: #2563eb;
                }

                @keyframes uk-co-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes uk-co-spin { to{transform:rotate(360deg)} }
                @keyframes uk-co-pulse{ 0%,100%{opacity:1} 50%{opacity:0.5} }

                .uk-co-root {
                    font-family: 'Jost', sans-serif;
                    min-height: 100vh;
                    background: var(--uk-bg);
                    padding: 32px 16px 64px;
                }

                .uk-co-inner {
                    max-width: 1080px;
                    margin: 0 auto;
                }

                /* ── Back button ── */
                .uk-co-back {
                    display: inline-flex; align-items: center; gap: 10px;
                    font-size: 13px; font-weight: 600; color: var(--uk-ink-muted);
                    background: none; border: none; cursor: pointer;
                    padding: 0; margin-bottom: 28px; transition: color 0.2s;
                    font-family: 'Jost', sans-serif;
                }
                .uk-co-back:hover { color: var(--uk-ink); }
                .uk-co-back-circle {
                    width: 32px; height: 32px;
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .uk-co-back:hover .uk-co-back-circle {
                    border-color: var(--uk-accent);
                    color: var(--uk-accent);
                }

                /* ── Layout ── */
                .uk-co-layout {
                    display: flex; gap: 24px; align-items: flex-start;
                }
                @media (max-width: 900px) { .uk-co-layout { flex-direction: column; } }

                .uk-co-main { flex: 1; min-width: 0; }

                /* ── Step Indicator ── */
                .uk-co-steps {
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    padding: 20px 24px;
                    margin-bottom: 16px;
                    display: flex; align-items: center;
                }
                .uk-co-step-item { display: flex; align-items: center; flex: 1; }
                .uk-co-step-dot {
                    width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: 700;
                    transition: all 0.3s;
                    flex-shrink: 0;
                }
                .uk-co-step-dot.done {
                    background: var(--uk-green); color: white;
                }
                .uk-co-step-dot.active {
                    background: var(--uk-accent); color: white;
                    box-shadow: 0 0 0 4px rgba(200,169,110,0.2);
                }
                .uk-co-step-dot.pending {
                    background: rgba(28,25,23,0.06); color: var(--uk-ink-faint);
                }
                .uk-co-step-label {
                    font-size: 12px; font-weight: 600;
                    margin-left: 8px; display: none;
                    letter-spacing: 0.04em;
                }
                @media (min-width: 480px) { .uk-co-step-label { display: block; } }
                .uk-co-step-label.done { color: var(--uk-green); }
                .uk-co-step-label.active { color: var(--uk-accent); }
                .uk-co-step-label.pending { color: var(--uk-ink-faint); }
                .uk-co-step-line {
                    flex: 1; height: 1.5px; margin: 0 10px;
                    transition: background 0.5s;
                }
                .uk-co-step-line.done { background: var(--uk-green); }
                .uk-co-step-line.pending { background: var(--uk-border); }

                /* ── Cards ── */
                .uk-co-card {
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    padding: 28px;
                    margin-bottom: 16px;
                    animation: uk-co-up 0.45s cubic-bezier(.22,1,.36,1) both;
                }
                .uk-co-card-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.35rem; font-weight: 600;
                    color: var(--uk-ink); letter-spacing: -0.01em;
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 24px;
                }
                .uk-co-card-title-icon {
                    color: var(--uk-accent); font-size: 14px;
                }
                .uk-co-eyebrow {
                    font-size: 9px; font-weight: 700;
                    letter-spacing: 0.18em; text-transform: uppercase;
                    color: var(--uk-ink-faint); margin-bottom: 12px;
                }

                /* ── Inputs ── */
                .uk-co-field { margin-bottom: 14px; }
                .uk-co-label {
                    display: block; font-size: 11px; font-weight: 600;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    color: var(--uk-ink-faint); margin-bottom: 7px;
                }
                .uk-co-input {
                    width: 100%; padding: 11px 14px;
                    background: #faf9f7;
                    border: 1px solid var(--uk-border);
                    color: var(--uk-ink); font-size: 14px;
                    font-family: 'Jost', sans-serif;
                    outline: none; transition: all 0.2s; box-sizing: border-box;
                }
                .uk-co-input::placeholder { color: var(--uk-ink-faint); }
                .uk-co-input:focus {
                    border-color: var(--uk-accent);
                    background: var(--uk-accent-bg);
                    box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
                }
                .uk-co-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
                @media (max-width: 480px) { .uk-co-grid-2 { grid-template-columns: 1fr; } }

                /* ── Primary Button ── */
                .uk-co-btn-primary {
                    width: 100%; padding: 14px;
                    background: var(--uk-ink); color: white;
                    font-family: 'Jost', sans-serif;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-top: 4px;
                }
                .uk-co-btn-primary:hover:not(:disabled) { background: #2d2926; }
                .uk-co-btn-primary:active:not(:disabled) { transform: scale(0.99); }
                .uk-co-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

                .uk-co-btn-accent {
                    width: 100%; padding: 14px;
                    background: var(--uk-accent); color: white;
                    font-family: 'Jost', sans-serif;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-top: 4px;
                }
                .uk-co-btn-accent:hover:not(:disabled) { background: var(--uk-accent-dark); }
                .uk-co-btn-accent:active:not(:disabled) { transform: scale(0.99); }
                .uk-co-btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }

                .uk-co-btn-green {
                    width: 100%; padding: 14px;
                    background: var(--uk-green); color: white;
                    font-family: 'Jost', sans-serif;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-top: 4px;
                }
                .uk-co-btn-green:hover:not(:disabled) { background: #047857; }
                .uk-co-btn-green:disabled { opacity: 0.55; cursor: not-allowed; }

                .uk-co-btn-danger {
                    width: 100%; padding: 14px;
                    background: #dc2626; color: white;
                    font-family: 'Jost', sans-serif;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-top: 4px;
                }

                /* ── Error strip ── */
                .uk-co-error {
                    background: var(--uk-red-bg);
                    border: 1px solid rgba(220,38,38,0.2);
                    color: var(--uk-red);
                    font-size: 12px; font-weight: 500;
                    padding: 10px 14px; margin-bottom: 16px;
                    display: flex; align-items: flex-start; gap: 8px;
                }

                /* ── Step 1 — Contact ── */
                .uk-co-phone-wrap { position: relative; }
                .uk-co-phone-prefix {
                    position: absolute; left: 14px; top: 50%;
                    transform: translateY(-50%);
                    font-size: 13px; font-weight: 600; color: var(--uk-ink-muted);
                    pointer-events: none;
                }
                .uk-co-input-phone { padding-left: 46px !important; }

                /* ── Step 2 — Address ── */
                .uk-co-addr-card {
                    border: 1.5px solid var(--uk-border);
                    padding: 16px; margin-bottom: 10px;
                    cursor: pointer; transition: all 0.2s; position: relative;
                    background: var(--uk-surface);
                }
                .uk-co-addr-card.selected {
                    border-color: var(--uk-accent);
                    background: var(--uk-accent-bg);
                }
                .uk-co-addr-card:hover:not(.selected) { border-color: var(--uk-ink-muted); }
                .uk-co-addr-label-chip {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: 0.08em; text-transform: uppercase;
                    padding: 3px 8px;
                    margin-bottom: 6px;
                }
                .uk-co-addr-label-Home { background: rgba(200,169,110,0.15); color: var(--uk-accent-dark); }
                .uk-co-addr-label-Work { background: rgba(37,99,235,0.1); color: #2563eb; }
                .uk-co-addr-label-Other { background: rgba(109,40,217,0.1); color: #7c3aed; }
                .uk-co-addr-selected-dot {
                    position: absolute; top: 12px; right: 12px;
                    width: 20px; height: 20px;
                    background: var(--uk-accent);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 10px;
                }
                .uk-co-addr-default-badge {
                    display: inline-flex; align-items: center; gap: 3px;
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    background: var(--uk-green-bg); color: var(--uk-green);
                    padding: 2px 7px; margin-left: 6px;
                }
                .uk-co-addr-actions {
                    display: flex; align-items: center; gap: 12px;
                    margin-top: 10px; padding-top: 10px;
                    border-top: 1px solid var(--uk-border);
                }
                .uk-co-addr-action-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 700;
                    background: none; border: none; cursor: pointer;
                    padding: 0; font-family: 'Jost', sans-serif;
                    transition: color 0.2s;
                }
                .uk-co-addr-action-btn.edit { color: var(--uk-blue); }
                .uk-co-addr-action-btn.edit:hover { color: #1d4ed8; }
                .uk-co-addr-action-btn.default { color: var(--uk-green); }
                .uk-co-addr-action-btn.default:hover { color: #047857; }
                .uk-co-addr-action-btn.del { color: #ef4444; margin-left: auto; }
                .uk-co-addr-action-btn.del:hover { color: #dc2626; }
                .uk-co-addr-del-confirm { display: flex; align-items: center; gap: 8px; margin-left: auto; }
                .uk-co-addr-del-yes {
                    background: #ef4444; color: white; border: none;
                    font-size: 10px; font-weight: 800; padding: 3px 8px; cursor: pointer;
                    font-family: 'Jost', sans-serif;
                }
                .uk-co-addr-del-no {
                    background: rgba(28,25,23,0.06); color: var(--uk-ink-muted);
                    border: none; font-size: 10px; font-weight: 700; padding: 3px 8px;
                    cursor: pointer; font-family: 'Jost', sans-serif;
                }
                .uk-co-add-addr-btn {
                    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 14px; border: 1.5px dashed var(--uk-border);
                    background: transparent; color: var(--uk-ink-muted);
                    font-size: 13px; font-weight: 600; font-family: 'Jost', sans-serif;
                    cursor: pointer; transition: all 0.2s; margin-top: 4px;
                }
                .uk-co-add-addr-btn:hover { border-color: var(--uk-accent); color: var(--uk-accent); }
                .uk-co-add-addr-form {
                    border: 1.5px dashed var(--uk-accent);
                    background: var(--uk-accent-bg);
                    padding: 18px; margin-top: 4px;
                }
                .uk-co-add-addr-form-title {
                    font-size: 11px; font-weight: 800;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    color: var(--uk-accent); margin-bottom: 14px;
                    display: flex; align-items: center; gap: 6px;
                }

                /* ── Step 3 — Payment ── */
                .uk-co-order-item {
                    display: flex; align-items: flex-start; gap: 14px;
                    padding-bottom: 16px; margin-bottom: 16px;
                    border-bottom: 1px solid var(--uk-border);
                }
                .uk-co-order-item:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
                .uk-co-order-img {
                    width: 56px; height: 56px;
                    object-fit: contain;
                    border: 1px solid var(--uk-border);
                    background: #faf9f7; padding: 4px; flex-shrink: 0;
                }
                .uk-co-customization-badge {
                    margin-top: 10px;
                    background: var(--uk-accent-bg);
                    border: 1px solid rgba(200,169,110,0.3);
                    padding: 10px 12px;
                }
                .uk-co-customization-title {
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: var(--uk-accent); margin-bottom: 6px;
                    display: flex; align-items: center; gap: 5px;
                }

                /* Delivery Address box */
                .uk-co-delivery-box {
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    padding: 18px 20px;
                    margin-bottom: 16px;
                }
                .uk-co-delivery-header {
                    display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
                }
                .uk-co-change-btn {
                    font-size: 11px; font-weight: 700;
                    color: var(--uk-accent); background: none; border: none;
                    cursor: pointer; font-family: 'Jost', sans-serif;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .uk-co-change-btn:hover { color: var(--uk-accent-dark); }

                /* Payment options */
                .uk-co-pay-option {
                    display: flex; align-items: center; gap: 14px;
                    padding: 16px; border: 1.5px solid var(--uk-border);
                    cursor: pointer; transition: all 0.2s; margin-bottom: 10px;
                    background: var(--uk-surface);
                }
                .uk-co-pay-option.selected-online {
                    border-color: var(--uk-accent);
                    background: var(--uk-accent-bg);
                }
                .uk-co-pay-option.selected-cod {
                    border-color: var(--uk-green);
                    background: var(--uk-green-bg);
                }
                .uk-co-pay-option.disabled {
                    opacity: 0.5; cursor: not-allowed;
                }
                .uk-co-pay-icon {
                    width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .uk-co-pay-icon-online { background: var(--uk-ink); color: white; }
                .uk-co-pay-icon-cod { background: var(--uk-green); color: white; }
                .uk-co-pay-icon-disabled { background: rgba(28,25,23,0.06); color: var(--uk-ink-faint); }
                .uk-co-pay-icon-loading { background: rgba(28,25,23,0.04); color: var(--uk-ink-faint); }
                .uk-co-pay-badge {
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    padding: 2px 7px; margin-left: 4px;
                }
                .uk-co-pay-badge-free { background: var(--uk-green-bg); color: var(--uk-green); }
                .uk-co-pay-badge-cod  { background: var(--uk-green-bg); color: var(--uk-green); }
                .uk-co-pay-badge-dist { background: rgba(37,99,235,0.1); color: #2563eb; }
                .uk-co-pay-check { margin-left: auto; font-size: 18px; flex-shrink: 0; }
                .uk-co-pay-check-online { color: var(--uk-accent); }
                .uk-co-pay-check-cod { color: var(--uk-green); }

                /* Info chips */
                .uk-co-info-chip {
                    display: flex; align-items: flex-start; gap: 8px;
                    padding: 10px 12px; margin-bottom: 12px;
                    font-size: 12px;
                }
                .uk-co-info-chip-accent { background: var(--uk-accent-bg); border: 1px solid rgba(200,169,110,0.2); color: var(--uk-accent-dark); }
                .uk-co-info-chip-green  { background: var(--uk-green-bg); border: 1px solid rgba(5,150,105,0.2); color: #047857; }
                .uk-co-info-chip-muted  { background: rgba(28,25,23,0.03); border: 1px solid var(--uk-border); color: var(--uk-ink-muted); }

                /* ── Right Sidebar ── */
                .uk-co-sidebar { width: 300px; flex-shrink: 0; }
                @media (max-width: 900px) { .uk-co-sidebar { width: 100%; } }
                .uk-co-price-card {
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    overflow: hidden; margin-bottom: 12px;
                    position: sticky; top: 20px;
                }
                .uk-co-price-header {
                    padding: 14px 18px;
                    border-bottom: 1px solid var(--uk-border);
                    background: var(--uk-ink);
                }
                .uk-co-price-header-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.05rem; font-weight: 600; color: white;
                }
                .uk-co-price-body { padding: 16px 18px; }
                .uk-co-price-row {
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 13px; margin-bottom: 10px;
                }
                .uk-co-price-divider {
                    height: 1px; background: var(--uk-border);
                    margin: 12px 0;
                }
                .uk-co-price-total {
                    display: flex; justify-content: space-between; align-items: baseline;
                }
                .uk-co-price-total-label { font-weight: 700; font-size: 14px; color: var(--uk-ink); }
                .uk-co-price-total-val {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.6rem; font-weight: 700; color: var(--uk-ink);
                }
                .uk-co-trust-card {
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    padding: 16px 18px;
                    display: flex; flex-direction: column; gap: 10px;
                }
                .uk-co-trust-item {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 12px; color: var(--uk-ink-muted);
                }
                .uk-co-trust-icon { flex-shrink: 0; }

                /* ── Address Form (inner) ── */
                .uk-af-root { display: flex; flex-direction: column; gap: 12px; }
                .uk-af-label-row { display: flex; gap: 6px; flex-wrap: wrap; }
                .uk-af-label-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 6px 12px;
                    border: 1.5px solid var(--uk-border);
                    background: var(--uk-surface); color: var(--uk-ink-muted);
                    font-size: 11px; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.18s;
                }
                .uk-af-label-btn.active { background: var(--uk-ink); color: white; border-color: var(--uk-ink); }
                .uk-af-label-btn:hover:not(.active) { border-color: var(--uk-ink-muted); }
                .uk-af-gps-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    margin-left: auto; padding: 6px 12px;
                    border: 1px solid rgba(37,99,235,0.25);
                    background: rgba(37,99,235,0.06); color: #2563eb;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
                    cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.18s;
                }
                .uk-af-gps-btn:hover:not(:disabled) { background: rgba(37,99,235,0.1); }
                .uk-af-gps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .uk-af-gps-msg {
                    font-size: 11px; font-weight: 500; padding: 8px 10px;
                }
                .uk-af-gps-msg.ok { background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.15); color: #2563eb; }
                .uk-af-gps-msg.err { background: var(--uk-red-bg); border: 1px solid rgba(220,38,38,0.2); color: var(--uk-red); }
                .uk-af-label-text {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
                    color: var(--uk-ink-faint); margin-bottom: 6px;
                }
                .uk-af-optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: rgba(168,162,158,0.7); }
                .uk-af-input {
                    width: 100%; padding: 10px 12px;
                    background: var(--uk-surface);
                    border: 1px solid var(--uk-border);
                    color: var(--uk-ink); font-size: 13px;
                    font-family: 'Jost', sans-serif;
                    outline: none; transition: all 0.2s; box-sizing: border-box;
                }
                .uk-af-input::placeholder { color: var(--uk-ink-faint); }
                .uk-af-input:focus { border-color: var(--uk-accent); box-shadow: 0 0 0 3px rgba(200,169,110,0.1); background: var(--uk-accent-bg); }
                .uk-af-input.pin-ok { border-color: var(--uk-green); }
                .uk-af-input.pin-err { border-color: var(--uk-red); }
                .uk-af-pin-msg { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; margin-top: 5px; }
                .uk-af-pin-msg.ok { color: var(--uk-green); }
                .uk-af-pin-msg.err { color: var(--uk-red); }
                .uk-af-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                @media (max-width: 480px) { .uk-af-grid-2 { grid-template-columns: 1fr; } }
                .uk-af-error {
                    background: var(--uk-red-bg); border: 1px solid rgba(220,38,38,0.2);
                    color: var(--uk-red); font-size: 12px; font-weight: 500; padding: 8px 12px;
                }
                .uk-af-actions { display: flex; gap: 8px; padding-top: 4px; }
                .uk-af-save-btn {
                    flex: 1; padding: 11px;
                    background: var(--uk-accent); color: white;
                    border: none; cursor: pointer;
                    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 700;
                    letter-spacing: 0.08em; text-transform: uppercase;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    transition: all 0.18s;
                }
                .uk-af-save-btn:hover:not(:disabled) { background: var(--uk-accent-dark); }
                .uk-af-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .uk-af-cancel-btn {
                    padding: 11px 18px;
                    background: rgba(28,25,23,0.06); color: var(--uk-ink-muted);
                    border: none; cursor: pointer;
                    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
                    transition: all 0.18s;
                }
                .uk-af-cancel-btn:hover { background: rgba(28,25,23,0.1); color: var(--uk-ink); }

                /* Spinner */
                .uk-spin { animation: uk-co-spin 0.7s linear infinite; display: inline-block; }

                /* Skeleton */
                .uk-co-skeleton { background: rgba(28,25,23,0.06); animation: uk-co-pulse 1.5s ease-in-out infinite; height: 60px; }

                /* No payment selected */
                .uk-co-no-payment { text-align: center; font-size: 12px; color: var(--uk-ink-faint); padding: 12px 0; letter-spacing: 0.04em; }
            `}</style>

            <div className="uk-co-inner">
                {/* Back */}
                <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="uk-co-back">
                    <span className="uk-co-back-circle"><FaArrowLeft size={11} /></span>
                    {step === 1 ? "Back to Cart" : `Back to ${STEPS[step - 2].label}`}
                </button>

                <div className="uk-co-layout">
                    <div className="uk-co-main">

                        {/* Step Indicator */}
                        <div className="uk-co-steps">
                            {STEPS.map((s, i) => (
                                <div key={s.id} className="uk-co-step-item">
                                    <div className={`uk-co-step-dot ${step > s.id ? "done" : step === s.id ? "active" : "pending"}`}>
                                        {step > s.id ? <FaCheckCircle size={13} /> : s.icon}
                                    </div>
                                    <span className={`uk-co-step-label ${step > s.id ? "done" : step === s.id ? "active" : "pending"}`}>
                                        {s.label}
                                    </span>
                                    {i < STEPS.length - 1 && (
                                        <div className={`uk-co-step-line ${step > s.id ? "done" : "pending"}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ══ STEP 1 — Contact ══ */}
                        {step === 1 && (
                            <div className="uk-co-card">
                                <h2 className="uk-co-card-title">
                                    <FaUser className="uk-co-card-title-icon" />
                                    Contact Details
                                </h2>
                                <div className="uk-co-field">
                                    <label className="uk-co-label">Full Name *</label>
                                    <input value={contact.name} onChange={e => { setContact(c => ({ ...c, name: e.target.value })); setError(""); }}
                                        placeholder="e.g. Rahul Verma" className="uk-co-input" />
                                </div>
                                <div className="uk-co-field">
                                    <label className="uk-co-label">Mobile Number *</label>
                                    <div className="uk-co-phone-wrap">
                                        <span className="uk-co-phone-prefix">+91</span>
                                        <input value={contact.phone} maxLength={10}
                                            onChange={e => { setContact(c => ({ ...c, phone: e.target.value })); setError(""); }}
                                            placeholder="10-digit number" className="uk-co-input uk-co-input-phone" />
                                    </div>
                                </div>
                                <div className="uk-co-field">
                                    <label className="uk-co-label">Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--uk-ink-faint)" }}>for order confirmation</span></label>
                                    <input type="email" value={contact.email}
                                        onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                                        placeholder="dhananjay072007@email.com" className="uk-co-input" />
                                </div>
                                {error && <div className="uk-co-error"><span>⚠</span> {error}</div>}
                                <button onClick={handleContactContinue} className="uk-co-btn-primary">
                                    Continue to Address →
                                </button>
                            </div>
                        )}

                        {/* ══ STEP 2 — Address ══ */}
                        {step === 2 && (
                            <div className="uk-co-card">
                                <h2 className="uk-co-card-title">
                                    <FaMapMarkerAlt className="uk-co-card-title-icon" />
                                    Delivery Address
                                </h2>
                                {addrLoading ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div className="uk-co-skeleton" />
                                        <div className="uk-co-skeleton" />
                                    </div>
                                ) : (
                                    <>
                                        {savedAddresses.map(addr => (
                                            <div key={addr._id}
                                                onClick={() => { if (!editingAddr && !showAddForm) setSelectedAddrId(addr._id); }}
                                                className={`uk-co-addr-card${selectedAddrId === addr._id ? " selected" : ""}`}>
                                                {selectedAddrId === addr._id && (
                                                    <div className="uk-co-addr-selected-dot">
                                                        <FaCheckCircle size={11} />
                                                    </div>
                                                )}
                                                {editingAddr?._id === addr._id ? (
                                                    <AddressForm initial={editingAddr} onSave={handleEditAddress} onCancel={() => setEditingAddr(null)} saving={savingAddr} />
                                                ) : (
                                                    <>
                                                        <div className={`uk-co-addr-label-chip uk-co-addr-label-${addr.label}`}>
                                                            {LABEL_ICONS[addr.label] || <FaMapMarkerAlt size={9} />}
                                                            {addr.label}
                                                            {addr.isDefault && <span className="uk-co-addr-default-badge">Default</span>}
                                                        </div>
                                                        <p style={{ fontWeight: 700, fontSize: 13, color: "var(--uk-ink)", marginBottom: 3 }}>
                                                            {addr.name} · <span style={{ fontWeight: 500 }}>{addr.phone}</span>
                                                        </p>
                                                        <p style={{ fontSize: 12, color: "var(--uk-ink-muted)", lineHeight: 1.6 }}>
                                                            {addr.house}, {addr.area},{addr.landmark ? ` ${addr.landmark},` : ""} {addr.city}, {addr.state} — {addr.pincode}
                                                        </p>
                                                        <div className="uk-co-addr-actions">
                                                            <button onClick={e => { e.stopPropagation(); setEditingAddr(addr); setShowAddForm(false); }} className="uk-co-addr-action-btn edit">
                                                                <FaEdit size={10} /> Edit
                                                            </button>
                                                            {!addr.isDefault && (
                                                                <button onClick={e => { e.stopPropagation(); handleSetDefault(addr._id); }} className="uk-co-addr-action-btn default">
                                                                    <FaBookmark size={9} /> Set Default
                                                                </button>
                                                            )}
                                                            {deleteConfirmId === addr._id ? (
                                                                <div className="uk-co-addr-del-confirm" onClick={e => e.stopPropagation()}>
                                                                    <span style={{ fontSize: 11, color: "var(--uk-red)", fontWeight: 700 }}>Delete?</span>
                                                                    <button onClick={() => handleDeleteAddress(addr._id)} className="uk-co-addr-del-yes">Yes</button>
                                                                    <button onClick={() => setDeleteConfirmId(null)} className="uk-co-addr-del-no">No</button>
                                                                </div>
                                                            ) : (
                                                                <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(addr._id); }} className="uk-co-addr-action-btn del">
                                                                    <FaTrash size={9} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {savedAddresses.length < 5 && (
                                            showAddForm ? (
                                                <div className="uk-co-add-addr-form">
                                                    <p className="uk-co-add-addr-form-title">
                                                        <FaPlus size={9} /> New Address
                                                    </p>
                                                    <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddForm(false)} saving={savingAddr} />
                                                </div>
                                            ) : (
                                                <button onClick={() => { setShowAddForm(true); setEditingAddr(null); }} className="uk-co-add-addr-btn">
                                                    <FaPlus size={12} /> Add New Address
                                                    <span style={{ fontSize: 11, color: "var(--uk-ink-faint)", fontWeight: 400 }}>({savedAddresses.length}/5)</span>
                                                </button>
                                            )
                                        )}

                                        {!user && savedAddresses.length === 0 && !showAddForm && (
                                            <p style={{ fontSize: 12, color: "var(--uk-ink-faint)", textAlign: "center", paddingTop: 8 }}>
                                                <button onClick={() => navigate("/login")} style={{ color: "var(--uk-accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Login</button>
                                                {" "}to save addresses, or add one below
                                            </p>
                                        )}

                                        {error && <div className="uk-co-error"><span>⚠</span> {error}</div>}
                                        <button onClick={handleAddressContinue} className="uk-co-btn-primary" style={{ marginTop: 12 }}>
                                            Continue to Payment →
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ══ STEP 3 — Payment ══ */}
                        {step === 3 && (
                            <>
                                {/* Order Summary */}
                                <div className="uk-co-card">
                                    <h2 className="uk-co-card-title">
                                        <FaClipboardList className="uk-co-card-title-icon" />
                                        Order Summary
                                    </h2>
                                    {checkoutItems.map((item, idx) => (
                                        <div key={item.cartKey || item._id || idx} className="uk-co-order-item">
                                            <img
                                                src={item.images?.[0]?.url || item.image || ""}
                                                alt={item.name}
                                                className="uk-co-order-img"
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--uk-ink)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.name}
                                                </p>
                                                <p style={{ fontSize: 11, color: "var(--uk-ink-faint)", marginBottom: 5 }}>
                                                    Qty: {item.quantity || 1}
                                                    {item.selectedSize && <span style={{ marginLeft: 8, background: "var(--uk-accent-bg)", color: "var(--uk-accent-dark)", padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{item.selectedSize}</span>}
                                                </p>
                                                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1.05rem", color: "var(--uk-ink)" }}>
                                                    ₹{(item.price * (item.quantity || 1)).toLocaleString("en-IN")}
                                                </p>
                                                {(item.customization?.text || item.customization?.imageUrl || item.customization?.note) && (
                                                    <div className="uk-co-customization-badge">
                                                        <p className="uk-co-customization-title"><FaPencilAlt size={8} /> Customization</p>
                                                        {item.customization.text && <p style={{ fontSize: 12, color: "var(--uk-ink)", marginBottom: 4 }}>{item.customization.text}</p>}
                                                        {item.customization.imageUrl && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <FaImage size={9} style={{ color: "var(--uk-accent)", flexShrink: 0 }} />
                                                                <img src={item.customization.imageUrl} alt="custom" style={{ height: 44, width: 44, objectFit: "cover", border: "1px solid rgba(200,169,110,0.3)" }} />
                                                                <span style={{ fontSize: 11, color: "var(--uk-accent-dark)" }}>Image uploaded</span>
                                                            </div>
                                                        )}
                                                        {item.customization.note && <p style={{ fontSize: 12, color: "var(--uk-ink-muted)", marginTop: 4 }}>{item.customization.note}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Delivering To */}
                                {selectedAddress && (
                                    <div className="uk-co-delivery-box">
                                        <div className="uk-co-delivery-header">
                                            <p className="uk-co-eyebrow" style={{ marginBottom: 0 }}>Delivering To</p>
                                            <button onClick={() => setStep(2)} className="uk-co-change-btn">Change</button>
                                        </div>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: "var(--uk-ink)" }}>{selectedAddress.name}</p>
                                        <p style={{ fontSize: 12, color: "var(--uk-ink-faint)", marginTop: 2 }}>{selectedAddress.phone}</p>
                                        <p style={{ fontSize: 12, color: "var(--uk-ink-muted)", marginTop: 6, lineHeight: 1.6 }}>{getAddress()}</p>
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="uk-co-card">
                                    <h2 className="uk-co-card-title">
                                        <FaCreditCard className="uk-co-card-title-icon" />
                                        Choose Payment Method
                                    </h2>

                                    {paymentMethod === "online" && amountForFree > 0 && (
                                        <div className="uk-co-info-chip uk-co-info-chip-accent">
                                            <FaTag size={11} style={{ flexShrink: 0 }} />
                                            <span>Add items worth <strong>₹{amountForFree.toLocaleString("en-IN")}</strong> more for FREE delivery!</span>
                                        </div>
                                    )}

                                    {/* Online */}
                                    <button onClick={() => { setPaymentMethod("online"); setError(""); setPayState("idle"); }}
                                        className={`uk-co-pay-option${paymentMethod === "online" ? " selected-online" : ""}`}>
                                        <div className="uk-co-pay-icon uk-co-pay-icon-online"><FaLock size={15} /></div>
                                        <div style={{ flex: 1, textAlign: "left" }}>
                                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--uk-ink)" }}>Pay Online</span>
                                                {itemsTotal >= FREE_DELIVERY_ABOVE && (
                                                    <span className="uk-co-pay-badge uk-co-pay-badge-free">🚚 Free Delivery</span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: 12, color: "var(--uk-ink-faint)" }}>UPI, Cards, Net Banking, Wallets, EMI</p>
                                        </div>
                                        {paymentMethod === "online" && <FaCheckCircle className="uk-co-pay-check uk-co-pay-check-online" />}
                                    </button>

                                    {/* COD */}
                                    {codChecking ? (
                                        <div className="uk-co-pay-option">
                                            <div className="uk-co-pay-icon uk-co-pay-icon-loading"><FaSpinner size={14} className="uk-spin" /></div>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--uk-ink-faint)" }}>Checking COD availability…</p>
                                        </div>
                                    ) : codAvailable ? (
                                        <button onClick={() => { setPaymentMethod("cod"); setError(""); setPayState("idle"); }}
                                            className={`uk-co-pay-option${paymentMethod === "cod" ? " selected-cod" : ""}`}>
                                            <div className="uk-co-pay-icon uk-co-pay-icon-cod"><FaMoneyBillWave size={15} /></div>
                                            <div style={{ flex: 1, textAlign: "left" }}>
                                                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--uk-ink)" }}>Cash on Delivery</span>
                                                    <span className="uk-co-pay-badge uk-co-pay-badge-cod">COD</span>
                                                    {codDistance !== null && codDistance < 999 && (
                                                        <span className="uk-co-pay-badge uk-co-pay-badge-dist">📍 {codDistance.toFixed(1)} km</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 12, color: "var(--uk-ink-faint)" }}>Pay when your order arrives · +₹70 delivery charge</p>
                                            </div>
                                            {paymentMethod === "cod" && <FaCheckCircle className="uk-co-pay-check uk-co-pay-check-cod" />}
                                        </button>
                                    ) : (
                                        <div className="uk-co-pay-option disabled">
                                            <div className="uk-co-pay-icon uk-co-pay-icon-disabled"><FaMoneyBillWave size={15} /></div>
                                            <div style={{ flex: 1, textAlign: "left" }}>
                                                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--uk-ink-faint)", marginBottom: 3 }}>Cash on Delivery</p>
                                                <p style={{ fontSize: 12, color: "var(--uk-ink-faint)" }}>
                                                    Not available for your pincode
                                                    {codDistance !== null && codDistance < 999 && <> · ~{codDistance.toFixed(0)} km away</>}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="uk-co-error" style={{ marginTop: 14, marginBottom: 0 }}>
                                            <span>⚠</span> <span>{error}</span>
                                        </div>
                                    )}

                                    {!paymentMethod && <p className="uk-co-no-payment">Select a payment method to continue</p>}

                                    {paymentMethod === "cod" && (
                                        <button onClick={handleCOD} disabled={loading} className="uk-co-btn-green">
                                            {loading ? <><FaSpinner size={14} className="uk-spin" /> Placing Order…</> :
                                                <><FaMoneyBillWave size={14} /> Place Order (COD) — ₹{finalTotal.toLocaleString("en-IN")}</>}
                                        </button>
                                    )}

                                    {paymentMethod === "online" && (
                                        <button onClick={handlePayWithRazorpay} disabled={loading}
                                            className={payState === "failed" ? "uk-co-btn-danger" : "uk-co-btn-primary"}>
                                            {loading ? <><FaSpinner size={14} className="uk-spin" /> Processing…</> :
                                                payState === "failed" ? <><FaRedo size={13} /> Retry — ₹{finalTotal.toLocaleString("en-IN")}</> :
                                                    <><FaLock size={13} /> Pay ₹{finalTotal.toLocaleString("en-IN")} Securely</>}
                                        </button>
                                    )}

                                    <p style={{ textAlign: "center", fontSize: 11, color: "var(--uk-ink-faint)", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, letterSpacing: "0.04em" }}>
                                        <FaShieldAlt size={9} /> Your order is 100% secure
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ══ SIDEBAR ══ */}
                    <div className="uk-co-sidebar">
                        <div className="uk-co-price-card">
                            <div className="uk-co-price-header">
                                <p className="uk-co-price-header-title">Price Details</p>
                            </div>
                            <div className="uk-co-price-body">
                                <div className="uk-co-price-row">
                                    <span style={{ color: "var(--uk-ink-muted)" }}>
                                        Items ({checkoutItems.length})
                                    </span>
                                    <span style={{ fontWeight: 600, color: "var(--uk-ink)" }}>
                                        ₹{itemsTotal.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="uk-co-price-row">
                                    <span style={{ color: "var(--uk-ink-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                        <FaTruck size={11} style={{ color: "var(--uk-ink-faint)" }} /> Delivery
                                        {paymentMethod === "cod" && <span style={{ fontSize: 10, color: "var(--uk-ink-faint)" }}>(COD)</span>}
                                    </span>
                                    {isFreeDelivery
                                        ? <span style={{ fontWeight: 700, color: "var(--uk-green)" }}>FREE</span>
                                        : <span style={{ fontWeight: 600, color: "var(--uk-ink)" }}>₹{deliveryCharge}</span>}
                                </div>
                                <div className="uk-co-price-row">
                                    <span style={{ color: "var(--uk-ink-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                        <FaShieldAlt size={11} style={{ color: "var(--uk-ink-faint)" }} /> Platform Fee
                                    </span>
                                    <span style={{ fontWeight: 600, color: "var(--uk-ink)" }}>₹{PLATFORM_FEE}</span>
                                </div>
                                <div className="uk-co-price-divider" />
                                <div className="uk-co-price-total">
                                    <span className="uk-co-price-total-label">Total</span>
                                    <span className="uk-co-price-total-val">₹{finalTotal.toLocaleString("en-IN")}</span>
                                </div>

                                {/* Context chips */}
                                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                                    {!paymentMethod && (
                                        <div className="uk-co-info-chip uk-co-info-chip-accent">
                                            <FaTruck size={10} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 11 }}>
                                                {itemsTotal >= FREE_DELIVERY_ABOVE ? "Free delivery on online payment!" : `Free delivery on orders ₹${FREE_DELIVERY_ABOVE}+ (online)`}
                                            </span>
                                        </div>
                                    )}
                                    {paymentMethod === "online" && isFreeDelivery && (
                                        <div className="uk-co-info-chip uk-co-info-chip-green">
                                            <FaCheckCircle size={10} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 11 }}>🎉 FREE delivery on this order!</span>
                                        </div>
                                    )}
                                    {paymentMethod === "online" && !isFreeDelivery && (
                                        <div className="uk-co-info-chip uk-co-info-chip-accent">
                                            <FaTag size={10} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 11 }}>Add ₹{amountForFree.toLocaleString("en-IN")} more for free delivery</span>
                                        </div>
                                    )}
                                    {paymentMethod === "cod" && (
                                        <div className="uk-co-info-chip uk-co-info-chip-muted">
                                            <FaMoneyBillWave size={10} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 11 }}>₹70 delivery charge applies on COD</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trust signals */}
                        <div className="uk-co-trust-card">
                            <div className="uk-co-trust-item">
                                <FaShieldAlt size={13} className="uk-co-trust-icon" style={{ color: "var(--uk-accent)" }} />
                                <span>Safe and Secure Payment</span>
                            </div>
                            <div className="uk-co-trust-item">
                                <FaTruck size={13} className="uk-co-trust-icon" style={{ color: "var(--uk-accent)" }} />
                                <span>Fast Delivery across India</span>
                            </div>
                            <div className="uk-co-trust-item">
                                <FaWhatsapp size={13} className="uk-co-trust-icon" style={{ color: "var(--uk-green)" }} />
                                <span>WhatsApp order confirmation</span>
                            </div>
                            <div className="uk-co-trust-item">
                                <FaMoneyBillWave size={13} className="uk-co-trust-icon" style={{ color: "var(--uk-green)" }} />
                                <span>COD available within {COD_RADIUS_KM} km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;