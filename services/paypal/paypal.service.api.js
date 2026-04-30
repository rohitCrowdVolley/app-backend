const axios = require("axios");
const { PAYPAL_API_BASE_URL } = require("../../config/constants");

const getPaypalAccess = async () => {
    const tokenRes = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            auth: {
                username: process.env.PAYPAL_CLIENT_ID,
                password: process.env.PAYPAL_SECRET,
            },
        }
    );

    return tokenRes.data.access_token;

}

const createPayPalOrder = async (portalId) => {

    const accessToken = await getPaypalAccess();

    const url = `https://app.hubspot.com/connected-apps/${portalId}`;

    const orderRes = await axios.post(
        `${PAYPAL_API_BASE_URL}/v2/checkout/orders`,
        {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: "99.00",
                    },
                    custom_id: portalId,
                },
            ],
            application_context: {
                return_url: url,
                cancel_url: url,
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
            },
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );


    return orderRes

}

module.exports = {
    createPayPalOrder
}