import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const SHOP = {
    name: process.env.SHOP_NAME || "SastaBazar",
    address: process.env.SHOP_ADDRESS || "Delhi , Uttar Pradesh",
    city: process.env.SHOP_CITY || "Delhi  ",
    stateCode: process.env.SHOP_STATE_CODE || "09",
    gstin: process.env.SHOP_GSTIN || "0932892382", // Update if you have new GST
    email: process.env.SHOP_EMAIL || "support@sastabazar.com",
    phone: "8808485840", // Aapka naya primary number
    website: "sastabazar.com",
};

const VERIFY_BASE = process.env.CLIENT_URL || "https://sastabazar.com";

// Professional E-commerce Color Palette (Flipkart Blue Theme)
const C = {
    primary: "#2874F0",      // SastaBazar Blue
    primaryLight: "#E3F2FD",
    dark: "#1F2937",
    zinc: "#374151",
    mid: "#6B7280",
    light: "#9CA3AF",
    border: "#E5E7EB",
    rowAlt: "#F9FAFB",
    white: "#FFFFFF",
    green: "#16A34A",
    greenLight: "#DCFCE7",
    red: "#DC2626",
    strikeGray: "#9CA3AF",
};

const rs = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const dt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

const getItemMrp = (item) => {
    const val = item?.mrp ?? item?.originalPrice ?? null;
    if (!val) return null;
    const n = Number(val);
    return n > 0 && n > Number(item.price) ? n : null;
};

export const generateInvoiceBuffer = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const invoiceNo = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
            const verifyUrl = `${VERIFY_BASE}/verify/${invoiceNo}`;

            // QR Code Generation
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                width: 100, margin: 1,
                color: { dark: C.dark, light: C.white },
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
            const payStatus = order.payment?.status || "PAID";
            const isPaid = (payMethod === "RAZORPAY" || payMethod === "ONLINE") && payStatus === "PAID";
            const isCOD = payMethod === "COD";

            let y = 0;

            // ── HEADER (SastaBazar Branding) ──
            rect(0, 0, PW, 4, C.primary);
            rect(0, 4, PW, 110, C.white);
            rect(M, 20, 3, 78, C.primary);

            doc.font("Helvetica-Bold").fontSize(24).fillColor(C.primary).text(SHOP.name.toUpperCase(), M + 14, 20);
            doc.font("Helvetica").fontSize(8).fillColor(C.mid).text("Aapka Apna Sasta Marketplace", M + 14, 48, { characterSpacing: 0.5 });
            doc.font("Helvetica").fontSize(8).fillColor(C.zinc)
                .text(SHOP.address, M + 14, 62)
                .text(SHOP.city + " | State Code: " + SHOP.stateCode, M + 14, 74)
                .text("GSTIN: " + SHOP.gstin + " | Contact: " + SHOP.phone, M + 14, 86);

            const boxW = 180, boxX = PW - M - boxW;
            doc.rect(boxX, 18, boxW, 34).fill(C.primary);
            doc.font("Helvetica-Bold").fontSize(14).fillColor(C.white).text("TAX INVOICE", boxX, 28, { width: boxW, align: "center" });
            doc.rect(boxX, 52, boxW, 48).fill(C.primaryLight);

            const metaInfo = (lbl, val, rowY) => {
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.zinc).text(lbl, boxX + 10, rowY);
                doc.font("Helvetica").fontSize(8).fillColor(C.dark).text(val, boxX + 70, rowY);
            };
            metaInfo("Invoice No:", invoiceNo, 60);
            metaInfo("Date:", dt(order.createdAt), 74);
            metaInfo("Website:", SHOP.website, 88);

            hline(115, C.primary, 1.5); y = 130;

            // ── BILLING & SHIPPING ──
            const half = CW / 2 - 12, rightCol = M + CW / 2 + 12;

            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.primary).text("SHIPPING ADDRESS", M, y);
            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.primary).text("ORDER SUMMARY", rightCol, y);
            y += 6;
            rect(M, y, half, 1, C.primaryLight);
            rect(rightCol, y, half, 1, C.primaryLight);
            y += 12;

            doc.font("Helvetica-Bold").fontSize(11).fillColor(C.dark).text(order.customerName || "Customer", M, y);
            doc.font("Helvetica").fontSize(9).fillColor(C.zinc).text("Mob: " + (order.phone || "—"), M, y + 16);

            let addrY = y + 32;
            doc.font("Helvetica").fontSize(8.5).fillColor(C.mid).text(order.address || "No Address Provided", M, addrY, { width: half, lineGap: 2 });
            const addrH = doc.heightOfString(order.address || "", { width: half });

            const orderMeta = [
                ["Order ID", "#" + (order._id.toString().slice(-8).toUpperCase())],
                ["Status", (order.orderStatus || "Processing").toUpperCase()],
                ["Payment", isCOD ? "Cash on Delivery" : "Online Paid"],
                ["Supply", "Uttar Pradesh (09)"]
            ];
            let ry = y;
            orderMeta.forEach(([l, v]) => {
                doc.font("Helvetica-Bold").fontSize(8).fillColor(C.mid).text(l + ":", rightCol, ry);
                doc.font("Helvetica").fontSize(8).fillColor(C.dark).text(v, rightCol + 80, ry);
                ry += 14;
            });

            y = Math.max(addrY + addrH + 10, ry) + 15;

            // ── ITEMS TABLE ──
            const COL = { no: M, desc: M + 25, qty: M + 260, rate: M + 310, total: M + 430 };
            const CW2 = { no: 20, desc: 230, qty: 40, rate: 110, total: 76 };

            rect(M, y, CW, 26, C.dark);
            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white);
            doc.text("#", COL.no, y + 9, { width: CW2.no, align: "center" });
            doc.text("ITEM DESCRIPTION", COL.desc, y + 9);
            doc.text("QTY", COL.qty, y + 9, { width: CW2.qty, align: "center" });
            doc.text("UNIT PRICE", COL.rate, y + 9, { width: CW2.rate, align: "center" });
            doc.text("TOTAL", COL.total, y + 9, { width: CW2.total, align: "right" });
            y += 26;

            let subtotal = 0;
            (order.items || []).forEach((item, i) => {
                const qty = Number(item.qty || 1);
                const price = Number(item.price || 0);
                const lineTotal = qty * price;
                subtotal += lineTotal;

                const bg = i % 2 === 0 ? C.white : C.rowAlt;
                rect(M, y, CW, 28, bg);

                doc.font("Helvetica").fontSize(9).fillColor(C.mid).text(i + 1, COL.no, y + 10, { width: CW2.no, align: "center" });
                doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(item.name || "Product", COL.desc, y + 10, { width: CW2.desc - 5, ellipsis: true });
                doc.font("Helvetica").fontSize(9).fillColor(C.dark).text(qty, COL.qty, y + 10, { width: CW2.qty, align: "center" });
                doc.font("Helvetica").fontSize(9).fillColor(C.dark).text(rs(price), COL.rate, y + 10, { width: CW2.rate, align: "center" });
                doc.font("Helvetica-Bold").fontSize(9).fillColor(C.primary).text(rs(lineTotal), COL.total, y + 10, { width: CW2.total, align: "right" });

                y += 28;
                if (y > 720) { doc.addPage(); y = 50; }
            });

            // ── TOTALS ──
            y += 10;
            hline(y, C.primary, 1);
            y += 15;

            const TX = M + CW - 200, TL = 100, TV = 100;
            const drawRow = (l, v, isBold = false, color = C.zinc) => {
                doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(color).text(l, TX, y);
                doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(color).text(v, TX + TL, y, { width: TV, align: "right" });
                y += 18;
            };

            drawRow("Subtotal:", rs(subtotal));
            drawRow("Delivery Fee:", order.deliveryCharge > 0 ? rs(order.deliveryCharge) : "FREE", false, order.deliveryCharge > 0 ? C.zinc : C.green);

            rect(TX - 5, y, TL + TV + 10, 25, C.primary);
            doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white).text("GRAND TOTAL", TX + 5, y + 7);
            doc.text(rs(order.totalAmount || subtotal), TX + TL, y + 7, { width: TV - 5, align: "right" });
            y += 40;

            // ── TRUST BOX & QR ──
            const qrY = y;
            rect(M, qrY, CW, 80, C.rowAlt);
            doc.rect(M, qrY, CW, 80).lineWidth(0.5).stroke(C.border);
            doc.image(qrBuffer, M + 10, qrY + 10, { width: 60 });

            doc.font("Helvetica-Bold").fontSize(10).fillColor(C.primary).text("Verify Your Purchase", M + 80, qrY + 15);
            doc.font("Helvetica").fontSize(8).fillColor(C.mid).text("Scan this QR to verify your invoice on sastabazar.com. SastaBazar ensures 100% original products.", M + 80, qrY + 30, { width: CW - 100 });
            doc.font("Helvetica-Bold").fontSize(8).fillColor(C.zinc).text("Secure Transaction | Fast Delivery | Easy Returns", M + 80, qrY + 55);

            // ── FOOTER ──
            const FY = 780;
            hline(FY, C.border);
            doc.font("Helvetica-Bold").fontSize(10).fillColor(C.primary).text("SastaBazar - Aapka Apna Marketplace", M, FY + 15, { align: "center", width: CW });
            doc.font("Helvetica").fontSize(8).fillColor(C.mid).text(`For Support: WhatsApp ${SHOP.phone} | Email: ${SHOP.email}`, M, FY + 30, { align: "center", width: CW });

            doc.end();

        } catch (err) {
            reject(err);
        }
    });
};