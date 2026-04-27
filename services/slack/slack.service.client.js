const axios = require("axios");

const createSlackApiClient = (token) => {
    return axios.create({
        baseURL: "https://slack.com/api/",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};


module.exports = createSlackApiClient;