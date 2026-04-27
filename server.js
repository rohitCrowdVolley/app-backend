const express = require("express");
require("dotenv").config();
require("./crons/cronjob");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const oauthRoutes = require("./routers/oauth/oauth.routes");
const extensionRoutes = require("./routers/extension/extension.routes");
const adminRoutes = require("./routers/admin/users.admin");
const oauthSlackRoutes = require("./routers/oauth/slack.oauth.routes");
const oauthTeamsRoutes = require("./routers/oauth/miscrosoft.oauth.routes");

app.use("/", oauthRoutes);
app.use("/hubdb", extensionRoutes);
app.use("/admin", adminRoutes);
app.use("/slack", oauthSlackRoutes);
app.use("/teams", oauthTeamsRoutes);
app.get("/", (req, res) => {
    res.send("HubSpot App Running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});