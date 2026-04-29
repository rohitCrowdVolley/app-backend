const constants = require("../../config/constants");
const { getTablesRows } = require("../hubspot/hubspot.service.api");

const getPlanDetails = async (portalId) => {
    const rows = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}`, });

    if (!rows.length) {
        return {
            success: false,
            message: "Account not found",
        };
    }

    const user = rows[0].values;

    const status = user.status;
    const endDate = new Date(user.plan_end_date);
    const today = new Date();

    const allowedStatus = constants.HUBDB_ACTIVE_PLAN.includes(status);

    const notExpired = today <= endDate;

    const allowed = allowedStatus && notExpired;

    return {
        success: true,
        allowed,
        status,
        plan_name: user.plan_name,
        plan_start_date: user.plan_start_date,
        plan_end_date: user.plan_end_date,
        trial_used: user.trial_used,
        portal_id: portalId,
    };
};

const checkPlan = async (req, res, next) => {
    try {
        const portalId = req.query.portalId;

        if (!portalId) {
            return res.status(400).json({
                success: false,
                message: "portalId required",
            });
        }

        const result = await getPlanDetails(portalId);

        if (!result.success || !result.allowed) {
            return res.status(403).json(result);
        }

        req.planData = result;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Plan validation failed",
        });
    }
};

const planStatus = async (req, res) => {
    try {
        const portalId = req.query.portalId;

        const result = await getPlanDetails(portalId);

        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch plan",
        });
    }
};


module.exports = {
    checkPlan,
    planStatus
};