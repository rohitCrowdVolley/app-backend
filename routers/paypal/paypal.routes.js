const express = require("express");
const { paypalOrder, paypalWebhook } = require("../../controllers/paypal/paypal.controller");
const router = express.Router();

router.get("/create-order", paypalOrder);
router.post("/webhook", paypalWebhook);

module.exports = router;