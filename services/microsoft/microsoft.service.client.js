const axios = require("axios");

const msApi = async ({ method = "GET", url, data = null, params = {} }) => {

    try {
        const response = await axios({
            method,
            url: `https://graph.microsoft.com/v1.0${url}`,
            headers: {
                Authorization: `Bearer ${accToken.access_token}`,
                "Content-Type": "application/json",
            },
            data,
            params,
        });

        return response.data;
    } catch (error) {
        console.log("MS API Error:", error.response?.data || error.message);
    }
};

module.exports = msApi;
