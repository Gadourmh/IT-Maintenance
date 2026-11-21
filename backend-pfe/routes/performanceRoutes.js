const express = require("express");

const router = express.Router();

const performanceController = require("../controllers/performanceController");
const { protect,authorize} = require("../middleware/authMiddleware");


router.post("/", protect ,authorize("ADMIN", "SUPER_ADMIN"), performanceController.createPerformance);

// Get Performances for the currently authenticated user
// The 'NORMAL' role is included as a regular user might want to see their own performance.
router.get("/me", protect, authorize("ADMIN", "SUPER_ADMIN", "NORMAL", "TECHNICIEN"), performanceController.getPerformanceByUserConnecté);

router.get("/", protect ,authorize("ADMIN", "SUPER_ADMIN","NORMAL"),performanceController.getPerformances);

router.get("/:id",protect ,authorize("ADMIN", "SUPER_ADMIN","NORMAL"), performanceController.getPerformanceById);

router.put("/:id",protect ,authorize("ADMIN", "SUPER_ADMIN"), performanceController.updatePerformance);

router.delete("/:id", protect , authorize("ADMIN", "SUPER_ADMIN") ,performanceController.deletePerformance);



module.exports = router;