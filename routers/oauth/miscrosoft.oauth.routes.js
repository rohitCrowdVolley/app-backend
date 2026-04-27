const express = require("express");
const router = express.Router();
const { handleTeamsCallback, initiateTeamsOAuth } = require("../../controllers/oauth/microsoft.oauth.controller");

router.get("/callback", handleTeamsCallback);
router.get("/initiate", initiateTeamsOAuth);

module.exports = router;