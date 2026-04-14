import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist, checkWishlist } from "../controllers/wishlistController.js";

const router = express.Router();
router.use(protect);
router.get("/",                 getWishlist);
router.get("/check/:productId", checkWishlist);
router.post("/:productId",      addToWishlist);
router.delete("/",              clearWishlist);
router.delete("/:productId",    removeFromWishlist);
export default router;
