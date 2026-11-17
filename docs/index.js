import specialityPaths from "./speciality.swagger.js";
import authPaths from "./auth.swagger.js";

const paths = {
  ...specialityPaths,
  ...authPaths,
};

export default paths;
