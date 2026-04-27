const axios = require("axios");

const createHubspotApiClient = (
  apiKey = process.env.HS_APP_TOKEN
) => {
  return axios.create({
    baseURL: "https://api.hubapi.com",
    headers: {
      Authorization: `Bearer ${apiKey || process.env.HS_APP_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
};


module.exports = createHubspotApiClient;