const { getHubdbTable } = require("../../services/hubspot/hubspot.service.api");
const { createPayPalOrder , capturePayPalOrder } = require("../../services/paypal/paypal.service.api");
const { getDateAfterDays } = require("../../services/utils/date");
const { renderSuccessPage } = require("../../services/utils/successPage");

const updatePortalPlan = async (portalId) => {
    let resData = await getHubdbTable({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });

    const values = {
        plan_name: "Pro Yearly",
        status: "active",
        plan_start_date: getDateAfterDays(),
        plan_end_date: getDateAfterDays(365),
        updated_at: getDateAfterDays(),
    }
    
    if (resData.length > 0) {

        await updateRowHubdb({ values, tableId: process.env.HS_HUB_TABLE_ID, rowId: resData[0].id });
        console.log(`Portal ${resData[0].portal_id} Package updated to Pro Yearly.`);
    };
}

const paypalOrder = async (req, res) => {
    try {
        const portalId = req.query.portalId;
        if (!portalId) return res.send("Portal ID is required ❌");
        const orderRes = await createPayPalOrder(portalId);

        const approveUrl = orderRes.data.links.find((l) => l.rel == "approve").href;

        return res.redirect(approveUrl);

    } catch (err) {
        console.log(err.response?.data || err.message);
        res.send("Error creating order ❌");
    }
}
const paypalCapture = async (req, res) => {
    try {
        const { token, portalId } = req.query; 

        if (!token) return res.send("Order Token is required ❌");

        await capturePayPalOrder(token);

        const url = `https://app.hubspot.com/connected-apps/${portalId}`;
        
        return res.send(
            renderSuccessPage({
                title: "Plan Activated",
                message: "Your plan has been activated successfully.",
                buttonText: "Go to Connected Apps",
                url,
            })
        );
    } catch (err) {
        console.error("Capture Error:", err.response?.data || err.message);
        res.status(500).send("Error capturing payment ❌");
    }
};

const paypalWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log("Received PayPal Webhook:", event);

        if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {

            const portalId = event.resource.custom_id;

            console.log("✅ Payment received for portal:", portalId);

            await updatePortalPlan(portalId);

        }

        res.sendStatus(200);
        const url = `https://app.hubspot.com/connected-apps/${portalId}`;
    }
    catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}

module.exports = {
    paypalOrder,
    paypalCapture,
    paypalWebhook

}