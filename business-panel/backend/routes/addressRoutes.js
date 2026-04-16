import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, verifyPincode, saveUHPincode, getUHPincode } from "../controllers/addressController.js";

const router = express.Router();

const addrRules = {
    name: { required: true, minLength: 2, maxLength: 100 },
    phone: { required: true, pattern: /^[6-9]\d{9}$/ },
    house: { required: true, minLength: 1, maxLength: 200 },
    area: { required: true, minLength: 2, maxLength: 200 },
    city: { required: true, minLength: 2, maxLength: 100 },
    state: { required: true, minLength: 2, maxLength: 100 },
    pincode: { required: true, pattern: /^\d{6}$/ },
};

router.get("/pincode/:pin", verifyPincode);
router.use(protect);
router.get("/uh-pincode", getUHPincode);
router.post("/uh-pincode", saveUHPincode);
router.get("/", getAddresses);
router.post("/", validateBody(addrRules), addAddress);
router.put("/:addressId", validateBody({ name: { required: false }, phone: { required: false, pattern: /^[6-9]\d{9}$/ } }), updateAddress);
router.delete("/:addressId", deleteAddress);
router.put("/:addressId/default", setDefaultAddress);

export default router;
