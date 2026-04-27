const express = require("express");
const router = express.Router();

const { createTable, getTable, getRows, addRow, updateRow } = require("../../controllers/extensions/extension.controller");

router.post("/create-table", createTable);
router.get("/get-table", getTable);

router.get("/get-rows", getRows);
router.post("/add-row", addRow);
router.patch("/update-row", updateRow);

module.exports = router;