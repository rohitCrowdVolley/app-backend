const axios = require("axios");
const { addRowHubdb, getTablesRows, updateRowHubdb, deleteRowHubdb } = require("../../services/hubspot/hubspot.service.api");
const { renderSuccessPage } = require("../../services/utils/successPage");
const { getDateAfterDays } = require("../../services/utils/date");
const { HUBSPOT_API_BASE_URL } = require("../../config/constants");

const handleCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) return res.send("No code ❌");

    try {
        const response = await axios.post(
            `${HUBSPOT_API_BASE_URL}/oauth/v1/token`,
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.HUBSPOT_CLIENT_ID,
                client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
                code,
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        let alreadyExists = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${response.data.hub_id}` });

        if (alreadyExists.length > 0) {
            const values = {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                updated_at: getDateAfterDays(),
            }
            await updateRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID, rowId: alreadyExists[0].id });
            console.log(`Portal ${response.data.hub_id} re-installed, tokens updated.`);
        }

        else {
            const values = {
                access_token: response.data.access_token,
                portal_id: response.data.hub_id,
                refresh_token: response.data.refresh_token,
                plan_name: "Free Trial",
                 status: { name: "trialing", type: "option" },
                plan_start_date: getDateAfterDays(),
                plan_end_date: getDateAfterDays(30),
                trial_used: 1,
                updated_at: getDateAfterDays(),
            }
            await addRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID });
            console.log(`Portal ${response.data.hub_id} installed and added to HubDB.`);

        }



        const url = `https://app.hubspot.com/connected-apps/${response.data.hub_id}/installed`;

        return res.send(
            renderSuccessPage({
                title: "App Installed",
                message: "Your app was installed successfully.",
                buttonText: "Go to Connected Apps",
                url,
            })
        );
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.send("Error ❌");
    }
};

const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post(
            `${HUBSPOT_API_BASE_URL}/oauth/v1/token`,
            new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.HUBSPOT_CLIENT_ID,
                client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                refresh_token: refreshToken
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = response.data.access_token;
        console.log("Access token refreshed successfully.");
        return accessToken;
    } catch (err) {
        console.log("Error fetching access token:", err.response?.data || err.message);
        return {
            error: err.response?.data || err.message
        };
    }
}

const refreshToken = async () => {
    try {
        let resData = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: "status__in=active,trialing" });
        for (const res of resData) {
            try {
                const refreshToken = res?.values?.refresh_token;
                if (!refreshToken) continue;

                const accessToken = await refreshAccessToken(refreshToken);
                if (accessToken?.error?.status == "BAD_REFRESH_TOKEN" || accessToken?.error?.error == "invalid_grant") {
                    await updateRowHubdb({
                        tableId: process.env.HS_HUB_TABLE_ID, rowId: res.id, values: {
                            status: { name: "uninstalled", type: "option" },
                            updated_at: getDateAfterDays(),
                            refresh_token: null,
                            access_token: null,
                            slack_token: null
                        },
                    });
                    console.log(
                        `Portal ${res?.values?.portal_id} marked as uninstalled`
                    );

                    continue;
                }
                const values = { access_token: accessToken }

                await updateRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID, rowId: res.id });
                console.log(`Portal ${res?.values?.portal_id} access token updated`);
            } catch (err) {
                console.log(`Error on row ${res.id}:`, err.message);
                continue;
            }
        }
    } catch (err) {
        console.log("Error fetching access token:", err.response?.data || err.message);
        throw err;
    }
}

// refreshToken()

module.exports = {
    handleCallback,
    refreshToken,
    refreshAccessToken
}