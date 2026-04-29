const express = require("express");
const router = express.Router();
const { handleSlackCallback, initiateSlackOAuth, slackTokenAvailable, removeSlackToken } = require("../../controllers/oauth/slack.oauth.controller");
const { checkPlan } = require("../../services/middleware/checkPlan");

router.get("/callback", checkPlan, handleSlackCallback);
router.get("/initiate", checkPlan, initiateSlackOAuth);
router.get("/token-available", checkPlan, slackTokenAvailable);
router.get("/token-remove", checkPlan, removeSlackToken);

module.exports = router;