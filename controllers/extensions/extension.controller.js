const { addRowHubdb, getHubdbTable, getTablesRows, updateRowHubdb, createHubdbTable } = require("../../services/hubspot/hubspot.service.api")

const getAccessToken = async ({ portalId }) => {
    try {
        const rows = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });

        return rows?.[0]?.values?.access_token || null;

    } catch (err) {
        return null;
    }
};
const createTable = async (req, res) => {
    try {
        const { tableName, label, columns } = req.body;
        const { portalId } = req.query;

        const accessToken = await getAccessToken({ portalId });

        const result = await createHubdbTable({ tableName, label, columns, apiKey: accessToken });

        return res.status(200).json({ success: true, tableId: result.tableId, data: result.data });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getTable = async (req, res) => {
    const { tableName, portalId } = req.query;

    try {
        const accessToken = await getAccessToken({ portalId });
        const result = await getHubdbTable({ tableName, apiKey: accessToken });

        res.status(200).json({ success: true, tableId: result.tableId, table: result?.table });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRows = async (req, res) => {
    try {
        const { tableId, filter, portalId } = req.query;

        const rows = await getTablesRows({ tableId, filter, apiKey: await getAccessToken({ portalId }) });

        res.status(200).json({ success: true, rows });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addRow = async (req, res) => {
    try {
        const { tableId, portalId } = req.query;
        const { values } = req.body;

        const result = await addRowHubdb({ tableId, values, apiKey: await getAccessToken({ portalId }) });

        res.status(200).json({
            success: true, rowId: result.rowId, row: result.row
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateRow = async (req, res) => {
    try {
        const { tableId, rowId, portalId } = req.query;
        const { values } = req.body;

        const result = await updateRowHubdb({ tableId, rowId, values, apiKey: await getAccessToken({ portalId }) });

        res.status(200).json({
            success: true,
            row: result.rowData
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createTable, getTable, getRows, addRow, updateRow };