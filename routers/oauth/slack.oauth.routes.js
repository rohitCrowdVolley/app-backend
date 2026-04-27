const express = require("express");
const router = express.Router();
const { handleSlackCallback, initiateSlackOAuth, slackTokenAvailable, removeSlackToken } = require("../../controllers/oauth/slack.oauth.controller");

router.get("/callback", handleSlackCallback);
router.get("/initiate", initiateSlackOAuth);
router.get("/token-available", slackTokenAvailable);
router.get("/token-remove", removeSlackToken);

module.exports = router;