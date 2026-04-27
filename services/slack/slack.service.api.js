const createSlackApiClient = require("./slack.service.client");
const slackRoutes = require("../../config/slackRoutes");

const getSlackUserByEmail = async ({ email, token }) => {
    const slackClient = createSlackApiClient(token);
    const { data } = await slackClient.get(`${slackRoutes.GET_USER_BY_EMAIL}${email}`)
    return data;
};

const getSlackUserPresence = async ({ userId, token }) => {
    const slackClient = createSlackApiClient(token);
    const { data } = await slackClient.get(`${slackRoutes.GET_PRESENCE_BY_USER_ID}${userId}`)
    return data;
};

module.exports = {
    getSlackUserByEmail,
    getSlackUserPresence

}