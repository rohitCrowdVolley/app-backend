const axios = require("axios");
const { HUBSPOT_API_BASE_URL } = require("../../config/constants");

const createHubspotApiClient = (
  apiKey = process.env.HS_APP_TOKEN
) => {
  return axios.create({
    baseURL: HUBSPOT_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey || process.env.HS_APP_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
};


module.exports = createHubspotApiClient;