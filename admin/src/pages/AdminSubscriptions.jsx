/**
 * AdminSubscriptions.jsx - Manage vendor subscriptions/monthly fees
 */
import { useState, useEffect, useCallback } from "react";
import adminApi from "../api/adminApi";

const PLANS = {
  basic:    { label:"Basic",    price:499,  products:30,  color:"#3b82f6" },
  standard: { label:"Standard", price:999,  products:100, color:"#8b5cf6" },
  premium:  { label:"Premium",  price:1999, products:500, color:"#f59e0b" },
};

const StatusBadge = ({ status }) => {
  const cfg = {
    active:          { bg:"#d1fae5", c:"#065f46", l:"Active"          },
    expired:         { bg:"#fee2e2", c:"#b91c1c", l:"Expired"         },
    cancelled:       { bg:"#f1f5f9", c:"#475569", l:"Cancelled"       },
    pending_payment: { bg:"#fef3c7", c:"#92400e", l:"Pending Payment" },
    none:            { bg:"#f1f5f9", c:"#94a3b8", l:"No Plan"         },
  }[status] || { bg:"#f1f5f9", c:"#475569", l: status };
  return <span style={{ background:cfg.bg,color:cfg.c,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20 }}>{cfg.l}</span>;
};

const AdminSubscriptions = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState({ text:"", type:"" });
  const [activating, setActivating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin/vendors?limit=100");
      setVendors(data.vendors || []);
    } catch { setMsg({ text:"Failed to load vendors", type:"error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activatePlan = async (vendorId, plan, months = 1) => {
    setActivating(vendorId);
    try {
      await adminApi.post(`/admin/vendors/${vendorId}/subscription`, { plan, months });
      setMsg({ text:`${PLANS[plan].label} plan activated for ${months} month(s)`, type:"success" });
      load();
    } catch (err) {
      setMsg({ text: err?.response?.data?.message || "Failed", type:"error" });
    } finally { setActivating(null); setTimeout(() => setMsg({ text:"", type:"" }), 4000); }
  };

  const S = {
    root: { padding:24, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    title: { fontSize:20, fontWeight:800, color:"#1e293b", marginBottom:6 },
    sub:   { fontSize:13, color:"#64748b", marginBottom:24 },
    card:  { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", marginBottom:16 },
    head:  { padding:"14px 20px", borderBottom:"1px solid #f1f5f9", background:"#f8fafc", display:"flex", justifyContent:"space-between", alignItems:"center" },
    row:   { padding:"16px 20px", borderBottom:"1px solid #f8fafc", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" },
    planBtn: (plan) => ({ padding:"6px 14px", border:`1.5px solid ${PLANS[plan].color}`, color:PLANS[plan].color, background:"#fff", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, transition:"all .2s" }),
  };

  const approved = vendors.filter(v => v.status === "approved");

  return (
    <div style={S.root}>
      <div style={S.title}>Subscription Management</div>
      <div style={S.sub}>Activate monthly plans for approved vendors</div>

      {msg.text && (
        <div style={{ background:msg.type==="success"?"#f0fdf4":"#fef2f2", border:`1px solid ${msg.type==="success"?"#bbf7d0":"#fecaca"}`, color:msg.type==="success"?"#166534":"#b91c1c", padding:"10px 16px", borderRadius:8, marginBottom:16, fontSize:13 }}>
          {msg.text}
        </div>
      )}

      {/* Plan summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key} style={{ background:"#fff", border:`1px solid #e2e8f0`, borderTop:`3px solid ${plan.color}`, borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{plan.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:plan.color, margin:"6px 0" }}>₹{plan.price}<span style={{ fontSize:12, fontWeight:500, color:"#94a3b8" }}>/mo</span></div>
            <div style={{ fontSize:12, color:"#64748b" }}>Up to {plan.products} products</div>
          </div>
        ))}
      </div>

      {/* Vendor list */}
      <div style={S.card}>
        <div style={S.head}>
          <span style={{ fontWeight:700, color:"#1e293b" }}>Approved Vendors ({approved.length})</span>
        </div>
        {loading ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>Loading…</div> :
        approved.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>No approved vendors yet</div> :
        approved.map(v => (
          <div key={v._id} style={S.row}>
            {/* Vendor info */}
            <div style={{ flex:1, minWidth:160 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{v.shopName}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{v.ownerName} · {v.email}</div>
            </div>
            {/* Current plan */}
            <div style={{ minWidth:120 }}>
              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:4 }}>Current Plan</div>
              <StatusBadge status={v.subscription?.status || "none"} />
              {v.subscription?.plan && <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>{PLANS[v.subscription.plan]?.label} · Expires {v.subscription?.expiryDate ? new Date(v.subscription.expiryDate).toLocaleDateString("en-IN") : "—"}</div>}
            </div>
            {/* Activate buttons */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.entries(PLANS).map(([key]) => (
                <button
                  key={key}
                  style={S.planBtn(key)}
                  disabled={activating === v._id}
                  onClick={() => activatePlan(v._id, key, 1)}
                  title={`Activate ${PLANS[key].label} for 1 month`}
                >
                  {activating === v._id ? "…" : PLANS[key].label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminSubscriptions;
