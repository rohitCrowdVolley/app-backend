const express = require("express");
const router = express.Router();
const { averageTimeDetails , getCheckUserAdmin} = require("../../controllers/admin/users.controller.js");

router.get("/reports", averageTimeDetails);
router.get("/permission", getCheckUserAdmin);

module.exports = router;