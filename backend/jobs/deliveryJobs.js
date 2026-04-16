/**
 * 🚚 DELIVERY AUTOMATION JOBS
 * Auto-assign delivery boys, update status, track location
 */

import Order from '../models/Order.js';
import DeliveryBoy from '../models/deliveryModels/DeliveryBoy.js';
import logger from '../utils/logger.js';

// ══════════════════════════════════════════════════════
// 1️⃣ AUTO-ASSIGN DELIVERY BOYS
// ══════════════════════════════════════════════════════
export const autoAssignDeliveryBoys = async () => {
    try {
        // Pending orders (confirmed, not assigned)
        const pendingOrders = await Order.find({
            status: 'CONFIRMED',
            'delivery.assignedBoyId': { $exists: false },
            createdAt: { $gt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Created in last 2 hours
        }).select('_id orderId delivery pincode vendorId');

        if (pendingOrders.length === 0) {
            return { assignmentsCreated: 0 };
        }

        let assigned = 0;

        for (const order of pendingOrders) {
            try {
                // Find available delivery boys near the area
                const nearbyBoys = await DeliveryBoy.find({
                    isActive: true,
                    isOnline: true,
                    serviceablePincodes: order.delivery?.pincode,
                    currentOrders: { $lt: 5 }, // Max 5 orders
                }).select('_id name phone currentOrders').sort({ currentOrders: 1 }).limit(3);

                if (nearbyBoys.length === 0) {
                    logger.warn(`No delivery boys available for order ${order.orderId}`);
                    continue;
                }

                // Assign to boy with least orders (load balancing)
                const selectedBoy = nearbyBoys[0];

                await Order.findByIdAndUpdate(order._id, {
                    $set: {
                        'delivery.assignedBoyId': selectedBoy._id,
                        'delivery.assignedAt': new Date(),
                        'delivery.status': 'ASSIGNED',
                    },
                });

                // Update delivery boy's current orders count
                await DeliveryBoy.findByIdAndUpdate(selectedBoy._id, {
                    $inc: { currentOrders: 1 },
                });

                logger.info(
                    `✅ Assigned order ${order.orderId} to delivery boy ${selectedBoy.name}`
                );
                assigned++;
            } catch (err) {
                logger.warn(`Failed to assign order ${order.orderId}`);
            }
        }

        return { assignmentsCreated: assigned, ordersProcessed: pendingOrders.length };
    } catch (err) {
        logger.error('Auto-Assign Delivery Boys Error:', err);
        throw { message: err.message, critical: true };
    }
};

// ══════════════════════════════════════════════════════
// 2️⃣ UPDATE DELIVERY STATUS
// ══════════════════════════════════════════════════════
export const updateDeliveryStatus = async () => {
    try {
        // Orders assigned but not picked up (> 30 mins from assignment)
        const notPickedUp = await Order.find({
            status: 'CONFIRMED',
            'delivery.assignedBoyId': { $exists: true },
            'delivery.status': 'ASSIGNED',
            'delivery.assignedAt': { $lt: new Date(Date.now() - 30 * 60 * 1000) },
        }).select('_id orderId delivery');

        let updated = 0;

        for (const order of notPickedUp) {
            try {
                // Auto-update status to PICKED_UP
                await Order.findByIdAndUpdate(order._id, {
                    $set: {
                        status: 'OUT_FOR_DELIVERY',
                        'delivery.status': 'OUT_FOR_DELIVERY',
                        'delivery.pickedUpAt': new Date(),
                    },
                });

                logger.info(`📦 Order ${order.orderId} auto-marked as OUT_FOR_DELIVERY`);
                updated++;
            } catch (err) {
                logger.warn(`Failed to update order ${order.orderId}`);
            }
        }

        if (updated > 0) {
            logger.info(`🚚 Updated ${updated} delivery statuses`);
        }

        return { statusUpdates: updated };
    } catch (err) {
        logger.error('Update Delivery Status Error:', err);
        throw { message: err.message };
    }
};

// ══════════════════════════════════════════════════════
// 3️⃣ AUTO-UPDATE DELIVERY BOY AVAILABILITY
// ══════════════════════════════════════════════════════
export const updateDeliveryBoyAvailability = async () => {
    try {
        // Check delivery boys inactive for > 30 mins
        const inactiveBoys = await DeliveryBoy.find({
            isOnline: true,
            lastActivityAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
        }).select('_id name');

        let updated = 0;

        for (const boy of inactiveBoys) {
            try {
                await DeliveryBoy.findByIdAndUpdate(boy._id, {
                    isOnline: false,
                    offlineReason: 'Auto-offline - no activity',
                    offlineAt: new Date(),
                });

                logger.info(`🔴 Delivery boy ${boy.name} marked offline (no activity)`);
                updated++;
            } catch (err) {
                logger.warn(`Failed to update delivery boy ${boy._id}`);
            }
        }

        if (updated > 0) {
            logger.info(`🔴 Marked ${updated} delivery boys as offline`);
        }

        return { boysMarkedOffline: updated };
    } catch (err) {
        logger.error('Update Delivery Boy Availability Error:', err);
        throw { message: err.message };
    }
};

// ══════════════════════════════════════════════════════
// 4️⃣ SEND DELIVERY BOY PERFORMANCE REPORTS
// ══════════════════════════════════════════════════════
export const sendDeliveryBoyReports = async () => {
    try {
        const boys = await DeliveryBoy.find({
            isActive: true,
        }).select('_id name email totalDeliveries rating');

        let sent = 0;

        for (const boy of boys) {
            try {
                // Calculate stats
                const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const completedOrders = await Order.countDocuments({
                    'delivery.assignedBoyId': boy._id,
                    status: 'DELIVERED',
                    createdAt: { $gte: thisMonth },
                });

                const avgRating = boy.rating || 0;

                logger.info(
                    `📊 ${boy.name}: ${completedOrders} deliveries, ${avgRating.toFixed(1)}/5 rating this month`
                );
                sent++;
            } catch (err) {
                logger.warn(`Failed to report for delivery boy ${boy._id}`);
            }
        }

        return { reportsGenerated: sent };
    } catch (err) {
        logger.error('Send Delivery Boy Reports Error:', err);
        throw { message: err.message };
    }
};
