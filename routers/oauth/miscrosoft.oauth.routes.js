const express = require("express");
const router = express.Router();
const { handleTeamsCallback, initiateTeamsOAuth } = require("../../controllers/oauth/microsoft.oauth.controller");
const { checkPlan } = require("../../services/middleware/checkPlan");

router.get("/callback", checkPlan, handleTeamsCallback);
router.get("/initiate", checkPlan, initiateTeamsOAuth);

module.exports = router;