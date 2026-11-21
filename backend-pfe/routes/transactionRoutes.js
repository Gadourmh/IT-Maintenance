const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect,authorize("ADMIN", "SUPER_ADMIN","NORMAL"), transactionController.getAllTransactions);
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"),transactionController.getTransactionById); // Nouvelle route ajoutée
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"),transactionController.createTransaction);
router.put("/:id", protect,authorize("ADMIN", "SUPER_ADMIN") ,transactionController.updateTransaction);
router.delete("/:id", protect,authorize("ADMIN", "SUPER_ADMIN"), transactionController.deleteTransaction);

module.exports = router;