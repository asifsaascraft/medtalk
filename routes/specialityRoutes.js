
import express from "express";

import {
  createSpeciality,
  getSpecialities,
  getSpecialityById,
  updateSpeciality,
  deleteSpeciality,
} from "../controllers/specialityController.js";


const router = express.Router();


// Speciality

router.post("/", createSpeciality);

router.get("/", getSpecialities);

router.get("/:id", getSpecialityById);

router.put("/:id", updateSpeciality);

router.delete("/:id", deleteSpeciality);

export default router;
