const axios = require("axios");
const { addRowHubdb, getTablesRows, updateRowHubdb, deleteRowHubdb } = require("../../services/hubspot/hubspot.service.api");
const { renderSuccessPage } = require("../../services/utils/successPage");

const handleCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) return res.send("No code ❌");

    try {
        const response = await axios.post(
            "https://api.hubapi.com/oauth/v1/token",
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
            return res.send("Already installed ✅");
        }

        const values = {
            access_token: response.data.access_token,
            portal_id: response.data.hub_id,
            refresh_token: response.data.refresh_token
        }

        await addRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID });
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
            'https://api.hubspot.com/oauth/v1/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.HUBSPOT_CLIENT_ID,
                client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                refresh_token: refreshToken
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = response.data.access_token;
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
        let resData = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID });
        for (const res of resData) {
            try {
                const refreshToken = res?.values?.refresh_token;
                if (!refreshToken) continue;

                const accessToken = await refreshAccessToken(refreshToken);
                if (accessToken?.error?.status == "BAD_REFRESH_TOKEN" || accessToken?.error?.error == "invalid_grant") {
                    await deleteRowHubdb({ tableId: process.env.HS_HUB_TABLE_ID, rowId: res.id });
                    console.log(
                        `Portal ${res?.values?.portal_id} removed`
                    );

                    continue;
                }
                const values = { access_token: accessToken }

                updateRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID, rowId: res.id });
                console.log("Access token updated successfully.")
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
}