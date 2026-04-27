const axios = require("axios");
const { getTablesRows, addRowHubdb, updateRowHubdb } = require("../../services/hubspot/hubspot.service.api");
const teamRoutes = require("../../config/microsoftRoutes");

const getTeamsAccessToken = async (tenantId) => {
    try {
        const tokenUrl = `${teamRoutes.AUTH(tenantId)}/token`;

        const { data } = await axios.post(
            tokenUrl,
            new URLSearchParams({
                client_id: process.env.TEAMS_CLIENT_ID,
                client_secret: process.env.TEAMS_CLIENT_SECRET,
                grant_type: "client_credentials",
                scope: "https://graph.microsoft.com/.default"
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        return data.access_token;
    } catch (err) {
        console.error("Error generating Teams Access Token:", err.response?.data || err.message);
        throw new Error("Failed to generate Microsoft token");
    }
};

const handleTeamsCallback = async (req, res) => {
    const { tenant, state, admin_consent } = req.query;

    if (!admin_consent || admin_consent !== 'True') {
        return res.send("Admin consent was not granted ❌");
    }
    try {
        console.log("Received code:", code);

        const tokenUrl = `${teamRoutes.AUTH(tenant)}/token`;

        const accessToken = await getTeamsAccessToken(tenant);

        await updateRowHubdb({
            tableId: process.env.HS_HUB_TABLE_ID,
            portalId: portalId,
            values: {
                ms_tenant_id: tenant,
                ms_access_token: accessToken
            }
        });

        res.send("Successfully connected to Teams organization! ✅");


    } catch (err) {
        console.error(err.response?.data || err.message);
        res.send("Error ❌");
    }
};

const initiateTeamsOAuth = async (req, res) => {
    try {
        const portalId = req.query.portalId;
        const baseUrl = teamRoutes.AUTH("organizations");
        const url = `${baseUrl}/adminconsent?client_id=${process.env.TEAMS_CLIENT_ID}&redirect_uri=${process.env.TEAMS_REDIRECT_URI}&state=${portalId}`;
        res.redirect(url);
    }
    catch (err) {
        console.error(err.response?.data || err.message);
        res.send("Error ❌");
    }

}

module.exports = {
    initiateTeamsOAuth,
    handleTeamsCallback,
}
