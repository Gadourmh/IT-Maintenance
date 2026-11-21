const express = require("express");

const router = express.Router();

const recrutementController = require("../controllers/recrutementController");
const { protect, authorize } = require("../middleware/authMiddleware");




router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"),recrutementController.createRecrutement);

router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"),recrutementController.getRecrutements);

router.get("/:id", protect,authorize("ADMIN", "SUPER_ADMIN","NORMAL"), recrutementController.getRecrutementById);

router.put("/:id",protect, authorize("ADMIN", "SUPER_ADMIN") ,recrutementController.updateRecrutement);

router.delete("/:id", protect,  authorize("ADMIN", "SUPER_ADMIN"),recrutementController.deleteRecrutement);





module.exports = router;