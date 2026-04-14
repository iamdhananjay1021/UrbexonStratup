/**
 * Settings.jsx — v4.0 Production
 * Subscription info + security actions that work
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  FiLock, FiAlertTriangle, FiKey, FiLogOut,
} from "react-icons/fi";

const PLANS = [
  { key: "basic", label: "Basic", price: "₹499/mo", products: 30, desc: "30 products, standard support", color: "#3b82f6" },
  { key: "standard", label: "Standard", price: "₹999/mo", products: 100, desc: "100 products, priority support", color: "#7c3aed" },
  { key: "premium", label: "Premium", price: "₹1,999/mo", products: 500, desc: "500 products, dedicated support", color: "#f59e0b" },
];

const Card = ({ title, icon: Icon, color, children }) => (
  <div style={{
    background: "#fff", borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: 24, marginBottom: 16,
  }}>
    {title && (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} color={color} />
          </div>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    api.get("/vendor/subscription")
      .then(r => setSub(r.data.subscription))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) return setPwMsg({ text: "All fields required", type: "error" });
    if (pwForm.newPw.length < 6) return setPwMsg({ text: "Password must be at least 6 characters", type: "error" });
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg({ text: "Passwords do not match", type: "error" });
    try {
      setPwLoading(true);
      await api.patch("/auth/change-password", { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg({ text: "Password changed successfully!", type: "success" });
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwModal(false), 1500);
    } catch (err) {
      setPwMsg({ text: err.response?.data?.message || "Failed to change password", type: "error" });
    } finally { setPwLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendorAuth");
    navigate("/login");
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>Manage your account and subscription</p>
      </div>

      {/* Security */}
      <Card title="Security" icon={FiLock} color="#10b981">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0", borderBottom: "1px solid #f9fafb",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiKey size={15} color="#6b7280" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Change Password</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>Update your account password</div>
            </div>
          </div>
          <button onClick={() => { setPwModal(true); setPwMsg({ text: "", type: "" }); }} style={{
            padding: "7px 16px", border: "1.5px solid #e5e7eb",
            background: "#fff", borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer",
          }}>Change</button>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiLogOut size={15} color="#6b7280" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Logout</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>Sign out of your vendor account</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: "7px 16px", border: "1.5px solid #fecaca",
            background: "#fef2f2", borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer",
          }}>Logout</button>
        </div>
      </Card>

      {/* Change Password Modal */}
      {pwModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        }} onClick={e => { if (e.target === e.currentTarget) setPwModal(false); }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,.15)", animation: "fadeUp .2s ease",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Change Password</h3>
            {pwMsg.text && (
              <div style={{
                background: pwMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${pwMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                color: pwMsg.type === "success" ? "#065f46" : "#b91c1c",
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
              }}>{pwMsg.text}</div>
            )}
            {[
              { label: "Current Password", key: "current" },
              { label: "New Password", key: "newPw" },
              { label: "Confirm Password", key: "confirm" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input
                  type="password"
                  value={pwForm[f.key]}
                  onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb",
                    borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setPwModal(false)} style={{
                flex: 1, padding: 11, border: "1px solid #e5e7eb", background: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer",
              }}>Cancel</button>
              <button onClick={changePassword} disabled={pwLoading} style={{
                flex: 1, padding: 11, border: "none",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.6 : 1,
              }}>{pwLoading ? "Changing..." : "Change Password"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription */}
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        padding: 24, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          Subscription & Plans
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Choose a plan to list your products on Urbexon
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map(plan => {
            const isCurrent = sub?.plan === plan.key;
            return (
              <div key={plan.key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 16, borderRadius: 12, flexWrap: "wrap", gap: 12,
                border: `2px solid ${isCurrent ? plan.color : "#e5e7eb"}`,
                background: isCurrent ? `${plan.color}08` : "#fff",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{plan.label}</span>
                    {isCurrent && (
                      <span style={{
                        background: "#d1fae5", color: "#065f46",
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                      }}>Current Plan</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{plan.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: plan.color }}>{plan.price}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Up to {plan.products} products</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 16, background: "#fefce8", border: "1px solid #fde68a",
          borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#92400e",
        }}>
          💡 To activate/change your plan, contact admin at{" "}
          <strong>officialurbexon@gmail.com</strong> or WhatsApp{" "}
          <strong>8808485840</strong>. Online payment coming soon.
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        padding: 24, border: "1px solid #fee2e2",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <FiAlertTriangle size={18} color="#ef4444" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ef4444", margin: 0 }}>Danger Zone</h3>
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          To deactivate or delete your account, please contact support at{" "}
          <strong style={{ color: "#111827" }}>officialurbexon@gmail.com</strong>
        </p>
      </div>
    </div>
  );
};

export default Settings;