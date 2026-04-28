const cron = require('node-cron');
const { refreshToken } = require("../controllers/oauth/oauth.controller");
const { activeUserPresence } = require("../controllers/oauth/slack.oauth.controller");

cron.schedule('*/10 * * * *', () => {
    refreshToken();
    console.log('Refresh token every 20 minutes.');
});
cron.schedule('*/5 * * * *', () => {
    activeUserPresence();
    console.log('Checking the activity of logged-in users of each portal every 5 minutes.');
});