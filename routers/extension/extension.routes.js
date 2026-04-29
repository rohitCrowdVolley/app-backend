const express = require("express");
const router = express.Router();

const { createTable, getTable, getRows, addRow, updateRow } = require("../../controllers/extensions/extension.controller");
const { planStatus, checkPlan } = require("../../services/middleware/checkPlan");

router.post("/create-table", checkPlan, createTable);
router.get("/get-table", checkPlan, getTable);
router.get("/plan-status", planStatus);

router.get("/get-rows", checkPlan, getRows);
router.post("/add-row", checkPlan, addRow);
router.patch("/update-row", checkPlan, updateRow);

module.exports = router;