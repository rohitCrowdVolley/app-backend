const express = require("express");
const router = express.Router();
const { averageTimeDetails, getCheckUserAdmin } = require("../../controllers/admin/users.controller.js");
const { checkPlan } = require("../../services/middleware/checkPlan.js");

router.get("/reports", checkPlan, averageTimeDetails);
router.get("/permission", checkPlan, getCheckUserAdmin);

module.exports = router;