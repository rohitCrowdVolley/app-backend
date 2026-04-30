const axios = require("axios");
const { SLACK_API_BASE_URL } = require("../../config/constants");

const createSlackApiClient = (token) => {
    return axios.create({
        baseURL: SLACK_API_BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
};


module.exports = createSlackApiClient;