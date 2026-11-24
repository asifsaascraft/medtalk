import express from "express";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";

import uploadCouponFile from "../middlewares/uploadCouponFile.js";

import {
  importCoupons,
  getCoupons,
  getCouponById,
  deleteCoupon,
} from "../controllers/couponController.js";

const router = express.Router({
  mergeParams: true,
});

// All Coupon APIs require Admin authentication.
router.use(
  protect,
  authorize("admin"),
);


//==================================================
// IMPORT COUPON FILE
// POST /api/conferences/:conferenceId/coupons/import
//==================================================

router.post(
  "/import",
  uploadCouponFile,
  importCoupons,
);


//==================================================
// GET ALL COUPONS
// GET /api/conferences/:conferenceId/coupons
//==================================================

router.get(
  "/",
  getCoupons,
);


//==================================================
// GET COUPON BY ID
// DELETE COUPON
//==================================================

router
  .route("/:couponId")
  .get(getCouponById)
  .delete(deleteCoupon);

export default router;