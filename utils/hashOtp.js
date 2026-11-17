
import crypto from "crypto";

const hashOtp = (otp) => {
  if (!process.env.OTP_SECRET) {
    throw new Error("OTP_SECRET is not configured.");
  }

  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(String(otp))
    .digest("hex");
};

export default hashOtp;
