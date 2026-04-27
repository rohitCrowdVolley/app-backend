const axios = require("axios");
const { getTablesRows, addRowHubdb, updateRowHubdb } = require("../../services/hubspot/hubspot.service.api");
const slackRoutes = require("../../config/slackRoutes");
const { getSlackUserByEmail, getSlackUserPresence } = require("../../services/slack/slack.service.api");
const { renderSuccessPage } = require("../../services/utils/successPage");


const getAccessToken = async ({ portalId }) => {
    try {
        const rows = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });
        return rows?.[0]?.values?.access_token || null;

    } catch (err) {
        return null;
    }
};

const setAwayStart = async ({ rowId, value = Date.now(), apiKey }) => {
    try {
        await updateRowHubdb({ tableId: process.env.SESSION_TABLE_NAME, rowId, values: { away_start: value }, apiKey });
    } catch (err) {
        console.log("Set away_start error:", err.message);
    }
};

const endBreak = async ({ breakId, apiKey }) => {
    try {
        await updateRowHubdb({ tableId: process.env.BREAK_TABLE_NAME, rowId: breakId, values: { break_end: Date.now() }, apiKey });

    } catch (err) {
        console.log("End break error:", err.message);
    }
};

const autoLogout = async ({ sessionId, apiKey }) => {
    try {
        await updateRowHubdb({ tableId: process.env.SESSION_TABLE_NAME, rowId: sessionId, values: { login_end: Date.now() }, apiKey });
    } catch (error) {
        console.log("autoLogout error:", error.message);
    }
};

const startBreak = async ({ sessionId, userEmail, userId, apiKey }) => {
    try {
        await addRowHubdb({ tableId: process.env.BREAK_TABLE_NAME, values: { session_id: sessionId, userEmail, userId, break_start: Date.now() }, apiKey });

    } catch (error) {
        console.log("startBreak error:", error.message);
    }
};

const checkSlackUserPresence = async (sessionData, apiKey, slackToken) => {
    try {
        const values = sessionData?.values || {};
        const sessionId = sessionData?.id;
        let { userId, userEmail, appId, login_start, away_start } = values;

        console.log("===== CHECK START =====");
        console.log("User:", userEmail);

        if (!userEmail) {
            console.log("No userId → exiting");
            return;
        }
        const now = Date.now();

        const userRes = await getSlackUserByEmail({ email: userEmail, token: slackToken });
        if (!userRes.ok) {
            console.log("No user exiting in slack with email:", userEmail);
            return;
        }

        const slackUserId = userRes.user.id;
        const presenceRes = await getSlackUserPresence({ userId: slackUserId, token: slackToken });

        if (!presenceRes.ok) {
            return;
        }

        const status = presenceRes.presence?.toLowerCase();

        const isActive = status == "active";
        const isAway = status == "away";

        // if (isAway && !away_start) {
        //     await setAwayStart({ rowId: sessionId, apiKey, value: now });
        // }

        // if (isActive && away_start) {
        //     await setAwayStart({ rowId: sessionId, apiKey, value: null });
        // }

        const activeBreaks = await getTablesRows({ tableId: process.env.BREAK_TABLE_NAME, filter: `&session_id__in=${sessionId}&break_end__is_null=`, apiKey });;
        const currentBreak = activeBreaks?.[0];

        if (isActive) {
            if (currentBreak) {
                await endBreak({ breakId: currentBreak.id, apiKey });

            }
            return;
        }

        const diffAwayMinutes = away_start ? (now - away_start) / (1000 * 60) : 0;

        // if (diffAwayMinutes >= process.env.AWAY_TIME) {
        //     if (currentBreak) {
        //         await endBreak({ breakId: currentBreak.id, apiKey });
        //     }

        //     await autoLogout({ sessionId, apiKey });

        //     return;
        // }
        if (isAway) {
            if (currentBreak) {
                await endBreak({ breakId: currentBreak.id, apiKey });
            }

            await autoLogout({ sessionId, apiKey });

            return;
        }

        // if (isAway && !currentBreak) {
        //     await startBreak({ sessionId, userEmail, userId, apiKey });
        // }


    } catch (error) {
        console.log("Slack status error:", error.response?.data || error.message);
    }
};

const checkActiveUserlogs = async (apiKey, slackToken) => {

    const sessions = await getTablesRows({ tableId: process.env.SESSION_TABLE_NAME, filter: `login_end__is_null=`, apiKey });
    for (const session of sessions) {
        await checkSlackUserPresence(session, apiKey, slackToken);
        console.log("===== CHECK END =====");
    }

};

const activeUserPresence = async () => {
    try {
        let portals = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID });
        for (const portal of portals) {
            try {
                const portalId = portal?.values?.portal_id;
                const slackToken = portal?.values?.slack_token;
                if (!portalId || !slackToken) continue;

                console.log("===== CHECKING USER PRESENCE =====");
                console.log("portalId:", portalId);

                const apiKey = await getAccessToken({ portalId });
                if (!apiKey) {
                    continue;
                }

                await checkActiveUserlogs(apiKey, slackToken);

                console.log("===== USER PRESENCE CHECKED =====");

            } catch (err) {
                console.log(`Error on row ${portal?.id}:`, err.message);
                continue;
            }
        }
    } catch (err) {
        console.log("Error fetching access token:", err.response?.data || err.message);
        throw err;
    }
}
const slackTokenAvailable = async (req, res) => {
    try {
        const portalId = req.query.portalId;
        if (!portalId) {
            return res.status(400).json({ error: "portalId query parameter is required" });
        }
        let tableRow = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });
        if (!tableRow) {
            return res.status(404).json({ error: "Portal not found" });
        }
        const slackToken = tableRow[0]?.values?.slack_token;
        if (!slackToken) {
            return res.json({ available: false });
        }
        return res.json({ available: true });
    } catch (err) {
        console.log("Error checking Slack token:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const removeSlackToken = async (req, res) => {
    try {
        const portalId = req.query.portalId;
        if (!portalId) {
            return res.status(400).json({ error: "portalId query parameter is required" });
        }
        let tableRow = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });
        if (!tableRow) {
            return res.status(404).json({ error: "Portal not found" });
        }
        const rowId = tableRow[0].id;
        await updateRowHubdb({
            tableId: process.env.HS_HUB_TABLE_ID,
            rowId,
            values: {
                slack_token: null
            }
        });
        return res.json({ message: "Slack token removed successfully" });
    } catch (err) {
        console.log("Error removing Slack token:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const handleSlackCallback = async (req, res) => {
    const code = req.query.code;
    const portalId = req.query.state;

    if (!code) return res.send("No code ❌");

    try {
        const { data } = await axios.post(
            "https://slack.com/api/oauth.v2.access",
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                redirect_uri: process.env.SLACK_REDIRECT_URI,
                code,
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );


        let tableRow = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });
        if (!tableRow) {
            return res.send("Portal not found ❌");
        }

        const rowId = tableRow[0].id;

        await updateRowHubdb({
            tableId: process.env.HS_HUB_TABLE_ID,
            rowId,
            values: {
                slack_token: data?.authed_user?.access_token
            }
        });
        const url = `https://app.hubspot.com/app/${portalId}`;

        return res.send(
            renderSuccessPage({
                title: "Slack Connected",
                message: "Your account has been successfully linked with Slack.",
                buttonText: "Go to HubSpot",
                url,
            })
        );

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.send("Error ❌");
    }
};

const initiateSlackOAuth = async (req, res) => {
    try {
        const portalId = req.query.portalId;
        const url = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=users:read.email,users:read&user_scope=users:read.email,users:read&redirect_uri=${process.env.SLACK_REDIRECT_URI}&state=${portalId}`;
        res.redirect(url);
    }
    catch (err) {
        console.error(err.response?.data || err.message);
        res.send("Error ❌");
    }

}

module.exports = {
    activeUserPresence,
    handleSlackCallback,
    initiateSlackOAuth,
    slackTokenAvailable,
    removeSlackToken
};