const express = require("express");
const router = express.Router();

const { handleCallback } = require("../../controllers/oauth/oauth.controller");

router.get("/callback", handleCallback);


module.exports = router;