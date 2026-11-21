const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/",protect ,authorize("ADMIN", "SUPER_ADMIN") , budgetController.createBudget);
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"),budgetController.getAllBudgets);
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"),budgetController.updateBudget);
router.delete("/:id",protect,authorize("ADMIN", "SUPER_ADMIN"), budgetController.deleteBudget);

module.exports = router;
