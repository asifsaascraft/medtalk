
import crypto from "crypto";

const verifyOtp = (submittedHash, storedHash) => {
  if (
    typeof submittedHash !== "string" ||
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(submittedHash) ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const submittedBuffer = Buffer.from(submittedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (submittedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    submittedBuffer,
    storedBuffer,
  );
};

export default verifyOtp;
