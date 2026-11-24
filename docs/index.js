import specialityPaths from "./speciality.swagger.js";
import authPaths from "./auth.swagger.js";
import facultyPaths from "./faculty.swagger.js";
import userPaths from "./user.swagger.js";
import conferencePaths from "./conference.swagger.js";
import hallPaths from "./hall.swagger.js";
import couponPaths from "./coupon.swagger.js";

const paths = {
  ...specialityPaths,
  ...authPaths,
  ...facultyPaths,
  ...userPaths,
  ...conferencePaths,
  ...hallPaths,
  ...couponPaths,
};

export default paths;