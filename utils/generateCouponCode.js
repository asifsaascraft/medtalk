import crypto from "crypto";

const generateCouponCode = () => {
  return crypto
    .randomBytes(8)
    .toString("hex")
    .substring(0, 8)
    .toUpperCase();
};

export default generateCouponCode;