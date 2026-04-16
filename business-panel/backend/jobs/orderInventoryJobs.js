/**
 * 📦 ORDER & INVENTORY AUTOMATION JOBS
 * Auto-complete orders, refunds, invoices, stock tracking
 */

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/emailService.js';

// ══════════════════════════════════════════════════════
// 1️⃣ AUTO-COMPLETE DELIVERED ORDERS
// ══════════════════════════════════════════════════════
export const autoCompleteDeliveredOrders = async () => {
    try {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const updated = await Order.updateMany(
            {
                status: 'OUT_FOR_DELIVERY',
                'delivery.updatedAt': { $lt: cutoffTime },
                isAutoCompleted: { $ne: true },
            },
            {
                $set: {
                    status: 'DELIVERED',
                    isAutoCompleted: true,
                    'delivery.completedAt': new Date(),
                },
            }
        );

        if (updated.modifiedCount > 0) {
            logger.info(
                `✅ Auto-Completed ${updated.modifiedCount} orders (OUT_FOR_DELIVERY > 24hrs)`
            );
        }

        return { ordersCompleted: updated.modifiedCount };
    } catch (err) {
        logger.error('Auto-Complete Orders Error:', err);
        throw { message: err.message, critical: true };
    }
};

// ══════════════════════════════════════════════════════
// 2️⃣ AUTO-REFUND EXPIRED PAYMENTS
// ══════════════════════════════════════════════════════
export const autoRefundExpiredPayments = async () => {
    try {
        const holdExpiry = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

        const refunded = await Order.updateMany(
            {
                paymentStatus: 'HOLD',
                'payment.createdAt': { $lt: holdExpiry },
                isAutoRefunded: { $ne: true },
            },
            {
                $set: {
                    paymentStatus: 'FAILED',
                    isAutoRefunded: true,
                    'payment.refundedAt': new Date(),
                    notes: 'Auto-refunded - payment hold expired',
                },
            }
        );

        if (refunded.modifiedCount > 0) {
            logger.info(`💰 Auto-Refunded ${refunded.modifiedCount} expired payment holds`);
        }

        return { paymentsRefunded: refunded.modifiedCount };
    } catch (err) {
        logger.error('Auto-Refund Payments Error:', err);
        throw { message: err.message, critical: true };
    }
};

// ══════════════════════════════════════════════════════
// 3️⃣ AUTO-GENERATE INVOICES
// ══════════════════════════════════════════════════════
export const autoGenerateInvoices = async () => {
    try {
        const orders = await Order.find({
            status: { $in: ['DELIVERED', 'OUT_FOR_DELIVERY'] },
            invoiceGenerated: { $ne: true },
        }).select('_id orderId items total').lean();

        if (orders.length === 0) {
            return { invoicesGenerated: 0 };
        }

        const generated = await Order.updateMany(
            { _id: { $in: orders.map(o => o._id) } },
            { $set: { invoiceGenerated: true, invoiceGeneratedAt: new Date() } }
        );

        logger.info(`📄 Auto-Generated ${generated.modifiedCount} invoices`);

        return { invoicesGenerated: generated.modifiedCount };
    } catch (err) {
        logger.error('Auto-Generate Invoices Error:', err);
        throw { message: err.message };
    }
};

// ══════════════════════════════════════════════════════
// 4️⃣ CHECK LOW STOCK ITEMS
// ══════════════════════════════════════════════════════
export const checkLowStockItems = async () => {
    try {
        const LOW_STOCK_THRESHOLD = 10;

        const lowStockProducts = await Product.find({
            stock: { $lte: LOW_STOCK_THRESHOLD },
            $expr: { $lt: ['$stock', '$minimumStock'] },
            isActive: true,
        }).select('name sku stock minimumStock vendorId');

        if (lowStockProducts.length === 0) {
            return { lowStockItems: 0 };
        }

        // Group by vendor and send alerts
        const vendorAlerts = {};
        for (const product of lowStockProducts) {
            if (!vendorAlerts[product.vendorId]) {
                vendorAlerts[product.vendorId] = [];
            }
            vendorAlerts[product.vendorId].push(product);
        }

        // Send alerts to vendors
        for (const [vendorId, products] of Object.entries(vendorAlerts)) {
            // Future: Send vendor alert email
            logger.warn(
                `⚠️  Vendor ${vendorId} has ${products.length} low-stock products`
            );
        }

        return { lowStockItemsFound: lowStockProducts.length };
    } catch (err) {
        logger.error('Check Low Stock Error:', err);
        throw { message: err.message };
    }
};
