const express = require("express");
const { paypalOrder, paypalWebhook ,paypalCapture} = require("../../controllers/paypal/paypal.controller");
const router = express.Router();

router.get("/create-order", paypalOrder);
router.post("/webhook", paypalWebhook);
router.get("/success", paypalCapture);

module.exports = router;