const msRoutes = require("../../config/microsoftRoutes");
const msApi  = require("./microsoft.service.client");

const getUserByEmail = async (email) => {
    const res = await msApi({
        method: "GET",
        url: msRoutes.USERS_FILTER_BY_EMAIL(email),
    });

    return res.value?.[0].id || null;
};

const getUserPresence = async (userId) => {
    const res = await msApi({
        method: "GET",
        url: msRoutes.USER_PRESENCE(userId),
    });

    return res?.availability;
};

const userMirosoftStatus = async (email) => {
    let userStatus = null;
    const userId = await getUserByEmail(email);
    if (userId) {
        userStatus = await getUserPresence(userId);
    }
    return userStatus;
}

module.exports = {
    userMirosoftStatus
};