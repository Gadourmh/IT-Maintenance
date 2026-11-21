const express = require("express");
const router = express.Router();
const rapportFinancierController = require("../controllers/rapportFinancierController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/",protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), rapportFinancierController.getAllReports);
router.post("/", protect ,  authorize("ADMIN", "SUPER_ADMIN"),rapportFinancierController.createReport);
router.put("/:id",protect, authorize("ADMIN", "SUPER_ADMIN"), rapportFinancierController.updateReport);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"),rapportFinancierController.deleteReport);

module.exports = router;