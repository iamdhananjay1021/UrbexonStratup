/**
 * invoiceEmailHelper.js
 * ─────────────────────────────────────────────────────────
 * Production-ready PDF invoice for Ecommerce & Urbexon Hour
 * PDFKit A4 · QR verification · GST-compliant · Dual mode
 * ─────────────────────────────────────────────────────────
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const SHOP = {
    name: process.env.SHOP_NAME || "Urbexon",
    tagline: process.env.SHOP_TAGLINE || "Your Premium Online Store",
    address: process.env.SHOP_ADDRESS || "Akbarpur, Ambedkar Nagar",
    city: process.env.SHOP_CITY || "Uttar Pradesh — 224122",
    stateCode: process.env.SHOP_STATE_CODE || "09",
    gstin: process.env.SHOP_GSTIN || "09AABCU1234F1Z5",
    email: process.env.SHOP_EMAIL || "officialurbexon@gmail.com",
    phone: process.env.SHOP_PHONE || "8808485840",
    website: process.env.SHOP_WEBSITE || "urbexon.in",
};

const VERIFY_BASE = process.env.CLIENT_URL || "https://urbexon.in";

/* ── Color palette ── */
const C = {
    primary: "#111827",
    primaryLight: "#F3F4F6",
    dark: "#1F2937",
    zinc: "#374151",
    mid: "#6B7280",
    light: "#9CA3AF",
    border: "#E5E7EB",
    rowAlt: "#F9FAFB",
    white: "#FFFFFF",
    green: "#16A34A",
    accent: "#4F46E5",
    uhPrimary: "#7C3AED",
    uhLight: "#F5F3FF",
    uhBg: "#EDE9FE",
    amber: "#D97706",
    red: "#DC2626",
};

const rs = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const dt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
const tm = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ══════════════════════════════════════════════════════
   MAIN EXPORT — generate invoice PDF buffer
══════════════════════════════════════════════════════ */
export const generateInvoiceBuffer = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const invoiceNo = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
            const verifyUrl = `${VERIFY_BASE}/verify/${invoiceNo}`;
            const isUH = order.orderMode === "URBEXON_HOUR";
            const accentColor = isUH ? C.uhPrimary : C.primary;
            const accentBg = isUH ? C.uhLight : C.primaryLight;

            /* QR code */
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                width: 100, margin: 1,
                color: { dark: accentColor, light: C.white },
            });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

            const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
            const chunks = [];
            doc.on("data", c => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", e => reject(e));

            const PW = 595;
            const M = 44;
            const CW = PW - M * 2;

            const rect = (x, y, w, h, fill) => doc.rect(x, y, w, h).fill(fill);
            const hline = (y, col = C.border, lw = 0.5) =>
                doc.moveTo(M, y).lineTo(PW - M, y).strokeColor(col).lineWidth(lw).stroke();

            const payMethod = order.payment?.method || "COD";
            const payStatus = order.payment?.status || "PENDING";
            const isCOD = payMethod === "COD";
            const isPaid = payStatus === "PAID";

            let y = 0;

            /* ── TOP BAR — 4px accent ── */
            rect(0, 0, PW, 4, accentColor);

            /* ── HEADER ── */
            rect(0, 4, PW, 110, C.white);
            rect(M, 20, 3, 78, accentColor);

            doc.font("Helvetica-Bold").fontSize(24).fillColor(accentColor)
                .text(SHOP.name.toUpperCase(), M + 14, 20);

            if (isUH) {
                doc.font("Helvetica-Bold").fontSize(7).fillColor(C.uhPrimary)
                    .text("⚡ URBEXON HOUR — EXPRESS DELIVERY", M + 14, 48, { characterSpacing: 0.8 });
            } else {
                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text(SHOP.tagline, M + 14, 48, { characterSpacing: 0.5 });
            }

            doc.font("Helvetica").fontSize(8).fillColor(C.zinc)
                .text(SHOP.address, M + 14, 62)
                .text(`${SHOP.city} | State Code: ${SHOP.stateCode}`, M + 14, 74)
                .text(`GSTIN: ${SHOP.gstin} | Contact: ${SHOP.phone}`, M + 14, 86);

            /* ── Invoice Type Box ── */
            const boxW = 180, boxX = PW - M - boxW;
            doc.rect(boxX, 18, boxW, 34).fill(accentColor);
            doc.font("Helvetica-Bold").fontSize(14).fillColor(C.white)
                .text("TAX INVOICE", boxX, 28, { width: boxW, align: "center" });

            doc.rect(boxX, 52, boxW, 48).fill(accentBg);
            const meta = (lbl, val, ry) => {
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.zinc).text(lbl, boxX + 10, ry);
                doc.font("Helvetica").fontSize(8).fillColor(C.dark).text(val, boxX + 70, ry);
            };
            meta("Invoice No:", invoiceNo, 60);
            meta("Date:", dt(order.createdAt), 74);
            meta("Order Type:", isUH ? "Urbexon Hour" : "Ecommerce", 88);

            hline(115, accentColor, 1.5); y = 130;

            /* ── SHIPPING + ORDER SUMMARY ── */
            const half = CW / 2 - 12;
            const rightCol = M + CW / 2 + 12;

            doc.font("Helvetica-Bold").fontSize(8).fillColor(accentColor)
                .text("SHIPPING ADDRESS", M, y)
                .text("ORDER SUMMARY", rightCol, y);
            y += 6;
            rect(M, y, half, 1, accentBg);
            rect(rightCol, y, half, 1, accentBg);
            y += 12;

            doc.font("Helvetica-Bold").fontSize(11).fillColor(C.dark)
                .text(order.customerName || "Customer", M, y);
            doc.font("Helvetica").fontSize(9).fillColor(C.zinc)
                .text("Mob: " + (order.phone || "—"), M, y + 16);
            if (order.email) {
                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text(order.email, M, y + 30);
            }

            let addrY = y + (order.email ? 44 : 32);
            doc.font("Helvetica").fontSize(8.5).fillColor(C.mid)
                .text(order.address || "No address provided", M, addrY, { width: half, lineGap: 2 });
            const addrH = doc.heightOfString(order.address || "", { width: half });

            const orderMeta = [
                ["Order ID", `#${order._id.toString().slice(-8).toUpperCase()}`],
                ["Status", (order.orderStatus || "Processing").toUpperCase()],
                ["Payment", isCOD ? "Cash on Delivery" : (isPaid ? "Online Paid ✅" : "Online (Pending)")],
                ["Mode", isUH ? "Express (45-120 min)" : "Standard (3-5 days)"],
                ["Supply", "Uttar Pradesh (09)"],
            ];

            if (isUH) {
                if (order.delivery?.provider) {
                    const providerMap = { LOCAL_RIDER: "Local Rider", VENDOR_SELF: "Vendor Delivery", SHIPROCKET: "Shiprocket" };
                    orderMeta.push(["Delivery By", providerMap[order.delivery.provider] || order.delivery.provider]);
                }
                if (order.delivery?.distanceKm) {
                    orderMeta.push(["Distance", `${Number(order.delivery.distanceKm).toFixed(1)} km`]);
                }
                if (order.delivery?.eta) {
                    orderMeta.push(["ETA", order.delivery.eta]);
                }
            }

            if (!isUH && order.shipping?.awbCode) {
                orderMeta.push(["AWB", order.shipping.awbCode]);
                if (order.shipping.courierName) {
                    orderMeta.push(["Courier", order.shipping.courierName]);
                }
            }

            if (order.payment?.razorpayPaymentId) {
                orderMeta.push(["Txn ID", order.payment.razorpayPaymentId]);
            }
            if (order.payment?.paidAt) {
                orderMeta.push(["Paid At", `${dt(order.payment.paidAt)} ${tm(order.payment.paidAt)}`]);
            }

            let ry = y;
            orderMeta.forEach(([l, v]) => {
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.mid).text(l + ":", rightCol, ry);
                doc.font("Helvetica").fontSize(8).fillColor(C.dark).text(v, rightCol + 80, ry);
                ry += 14;
            });

            y = Math.max(addrY + addrH + 10, ry) + 15;

            /* ── ITEMS TABLE ── */
            const COL = { no: M, desc: M + 25, hsn: M + 220, qty: M + 275, rate: M + 320, gst: M + 390, total: M + 430 };
            const CW2 = { no: 20, desc: 190, hsn: 50, qty: 40, rate: 65, gst: 35, total: 76 };

            rect(M, y, CW, 26, accentColor);
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.white);
            doc.text("#", COL.no, y + 9, { width: CW2.no, align: "center" });
            doc.text("ITEM DESCRIPTION", COL.desc, y + 9);
            doc.text("HSN", COL.hsn, y + 9, { width: CW2.hsn, align: "center" });
            doc.text("QTY", COL.qty, y + 9, { width: CW2.qty, align: "center" });
            doc.text("RATE", COL.rate, y + 9, { width: CW2.rate, align: "center" });
            doc.text("GST", COL.gst, y + 9, { width: CW2.gst, align: "center" });
            doc.text("TOTAL", COL.total, y + 9, { width: CW2.total, align: "right" });
            y += 26;

            let subtotal = 0;
            let totalGst = 0;
            (order.items || []).forEach((item, i) => {
                const qty = Number(item.qty || 1);
                const price = Number(item.price || 0);
                const lineTotal = qty * price;
                const gstPct = Number(item.gstPercent || 0);
                const gstAmt = gstPct > 0 ? (lineTotal * gstPct) / (100 + gstPct) : 0;
                subtotal += lineTotal;
                totalGst += gstAmt;

                const bg = i % 2 === 0 ? C.white : C.rowAlt;
                const rowH = 32;
                rect(M, y, CW, rowH, bg);

                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text(i + 1, COL.no, y + 8, { width: CW2.no, align: "center" });

                // Item name + size + customization
                doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.dark)
                    .text(item.name || "Product", COL.desc, y + 6, { width: CW2.desc - 5, ellipsis: true });
                let subLine = [];
                if (item.selectedSize) subLine.push(`Size: ${item.selectedSize}`);
                if (item.customization?.text) subLine.push(`Custom: ${item.customization.text}`);
                if (subLine.length) {
                    doc.font("Helvetica").fontSize(6.5).fillColor(C.light)
                        .text(subLine.join(" | "), COL.desc, y + 19, { width: CW2.desc - 5, ellipsis: true });
                }

                doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                    .text(item.hsnCode || "—", COL.hsn, y + 10, { width: CW2.hsn, align: "center" });
                doc.font("Helvetica").fontSize(8).fillColor(C.dark)
                    .text(qty, COL.qty, y + 10, { width: CW2.qty, align: "center" });
                doc.font("Helvetica").fontSize(8).fillColor(C.dark)
                    .text(rs(price), COL.rate, y + 10, { width: CW2.rate, align: "center" });
                doc.font("Helvetica").fontSize(7.5).fillColor(C.mid)
                    .text(gstPct > 0 ? `${gstPct}%` : "—", COL.gst, y + 10, { width: CW2.gst, align: "center" });
                doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.primary)
                    .text(rs(lineTotal), COL.total, y + 10, { width: CW2.total, align: "right" });

                y += rowH;
                if (y > 700) { doc.addPage(); y = 50; }
            });

            /* ── TOTALS ── */
            y += 12;
            hline(y, accentColor, 1);
            y += 15;

            const TX = M + CW - 220, TL = 120, TV = 100;
            const drawRow = (l, v, bold = false, color = C.zinc) => {
                doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(color).text(l, TX, y);
                doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(color).text(v, TX + TL, y, { width: TV, align: "right" });
                y += 17;
            };

            drawRow("Subtotal:", rs(subtotal));
            if (totalGst > 0) {
                drawRow("CGST:", rs(totalGst / 2));
                drawRow("SGST:", rs(totalGst / 2));
            }

            const deliveryLabel = isUH ? "Express Delivery:" : "Delivery:";
            drawRow(
                deliveryLabel,
                order.deliveryCharge > 0 ? rs(order.deliveryCharge) : "FREE",
                false,
                order.deliveryCharge > 0 ? C.zinc : C.green
            );
            if (order.platformFee > 0) drawRow("Platform Fee:", rs(order.platformFee));

            if (order.coupon?.discount > 0) {
                drawRow(
                    `Coupon (${order.coupon.code || "DISCOUNT"}):`,
                    `- ${rs(order.coupon.discount)}`,
                    false,
                    C.green
                );
            }

            /* Grand total box */
            y += 4;
            rect(TX - 5, y, TL + TV + 10, 28, accentColor);
            doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white)
                .text("GRAND TOTAL", TX + 5, y + 8)
                .text(rs(order.totalAmount || subtotal), TX + TL, y + 8, { width: TV - 5, align: "right" });
            y += 42;

            /* ── UH: Delivery timeline strip ── */
            if (isUH && y < 680) {
                rect(M, y, CW, 40, C.uhLight);
                doc.rect(M, y, CW, 40).lineWidth(0.5).stroke(C.uhBg);
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.uhPrimary)
                    .text("EXPRESS DELIVERY TIMELINE", M + 12, y + 6);

                const steps = ["Placed", "Confirmed", "Packed", "Pickup Ready", "Out for Delivery", "Delivered"];
                const stepW = (CW - 24) / steps.length;
                const curStatus = order.orderStatus || "PLACED";
                const statusMap = { PLACED: 0, CONFIRMED: 1, PACKED: 2, READY_FOR_PICKUP: 3, OUT_FOR_DELIVERY: 4, DELIVERED: 5 };
                const curIdx = statusMap[curStatus] ?? 0;

                steps.forEach((s, i) => {
                    const sx = M + 12 + i * stepW;
                    const done = i <= curIdx;
                    doc.font("Helvetica-Bold").fontSize(6).fillColor(done ? C.uhPrimary : C.light)
                        .text(done && i < curIdx ? "✓" : (i + 1).toString(), sx, y + 20, { width: 10 });
                    doc.font("Helvetica").fontSize(6).fillColor(done ? C.uhPrimary : C.light)
                        .text(s, sx + 10, y + 20, { width: stepW - 14 });
                });
                y += 50;
            }

            /* ── Ecommerce: AWB card ── */
            if (!isUH && order.shipping?.awbCode && y < 680) {
                rect(M, y, CW, 40, C.primaryLight);
                doc.rect(M, y, CW, 40).lineWidth(0.5).stroke(C.border);
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.primary)
                    .text("SHIPMENT DETAILS", M + 12, y + 6);

                const shipInfo = [];
                shipInfo.push(`AWB: ${order.shipping.awbCode}`);
                if (order.shipping.courierName) shipInfo.push(`Courier: ${order.shipping.courierName}`);
                if (order.shipping.shipmentId) shipInfo.push(`Shipment ID: ${order.shipping.shipmentId}`);

                doc.font("Helvetica").fontSize(8).fillColor(C.zinc)
                    .text(shipInfo.join("   |   "), M + 12, y + 22, { width: CW - 24 });
                y += 50;
            }

            /* ── COD notice ── */
            if (isCOD && !isPaid && y < 700) {
                rect(M, y, CW, 24, "#FEF3C7");
                doc.rect(M, y, CW, 24).lineWidth(0.5).stroke("#FDE68A");
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.amber)
                    .text("⚠ CASH ON DELIVERY — Amount payable at the time of delivery: " + rs(order.totalAmount), M + 12, y + 8, { width: CW - 24 });
                y += 34;
            }

            /* ── VERIFY BOX + QR ── */
            if (y > 710) { doc.addPage(); y = 50; }
            const qrY = y;
            rect(M, qrY, CW, 80, C.rowAlt);
            doc.rect(M, qrY, CW, 80).lineWidth(0.5).stroke(C.border);
            doc.image(qrBuffer, M + 10, qrY + 10, { width: 60 });

            doc.font("Helvetica-Bold").fontSize(10).fillColor(accentColor)
                .text("Verify Your Purchase", M + 80, qrY + 14);
            doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                .text(
                    isUH
                        ? "Scan this QR to verify your Urbexon Hour express order. Guaranteed fresh & fast delivery to your doorstep."
                        : "Scan this QR to verify your invoice on urbexon.in. Urbexon guarantees 100% authentic products.",
                    M + 80, qrY + 28, { width: CW - 100 }
                );
            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.zinc)
                .text(
                    isUH
                        ? "Express Delivery  ·  OTP Verified  ·  Real-Time Tracking"
                        : "Secure Transaction  ·  Fast Delivery  ·  Easy Returns",
                    M + 80, qrY + 55
                );

            /* ── FOOTER ── */
            const FY = 780;
            hline(FY, C.border);
            doc.font("Helvetica-Bold").fontSize(10).fillColor(accentColor)
                .text(`${SHOP.name} — ${isUH ? "Express Delivery Partner" : SHOP.tagline}`, M, FY + 10, { align: "center", width: CW });
            doc.font("Helvetica").fontSize(8).fillColor(C.mid)
                .text(`Support: WhatsApp ${SHOP.phone}  |  Email: ${SHOP.email}  |  ${SHOP.website}`, M, FY + 24, { align: "center", width: CW });
            doc.font("Helvetica").fontSize(6.5).fillColor(C.light)
                .text("This is a computer-generated invoice and does not require a signature.", M, FY + 38, { align: "center", width: CW });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};