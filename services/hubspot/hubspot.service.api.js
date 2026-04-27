const createHubspotApiClient = require("./hubspot.service.client");
const hubspotRoutes = require("../../config/hubspotRoutes");

const publishTable = async ({ tableId, apiKey = null }) => {
  try {

    const hsClient = createHubspotApiClient(apiKey);

    await hsClient.post(
      `${hubspotRoutes.HUBDB}/${tableId}/draft/publish`
    );
  } catch (err) {
    console.log("Publish error:", err.response?.data || err.message);
  }
}
const getTablesRows = async ({ tableId, filter = null, apiKey = null }) => {
  try {

    const hsClient = createHubspotApiClient(apiKey);

    let url = `${hubspotRoutes.HUBDB}/${tableId}/rows`;
    if (filter) url += `?${filter}`;
    const response = await hsClient.get(url);
    return response.data.results;
  } catch (err) {
    console.log("Error fetching filtered rows:", err.response?.data || err.message);
    return [];
  }
};

const addRowHubdb = async ({ values, tableId, apiKey = null }) => {
  try {
    const hsClient = createHubspotApiClient(apiKey);
    console.log("Adding row to HubDB table:", tableId);
    const { data } = await hsClient.post(`${hubspotRoutes.HUBDB}/${tableId}/rows`, { values });
    await publishTable({ tableId, apiKey });
    return {
      row: data,
      rowId: data.id
    };
  } catch ({ message }) {
    console.error(`Error adding row to HubDB table: ${message}`);
  }
};

const updateRowHubdb = async ({ values, tableId, rowId, apiKey = null }) => {
  try {
    console.log("update hubdb row.:", tableId);
    const hsClient = createHubspotApiClient(apiKey);

    const { data } = await hsClient.patch(`${hubspotRoutes.HUBDB}/${tableId}/rows/${rowId}/draft`,
      { values }
    );
    await publishTable({ tableId, apiKey });

    return {
      rowData: data
    };

  } catch (err) {
    console.log("Error updating access token:", err.message);
  }
};
const deleteRowHubdb = async ({ tableId, rowId, apiKey = null }) => {
  try {
    console.log("Deleting hubdb row.:", tableId);
    const hsClient = createHubspotApiClient(apiKey);

    const { data } = await hsClient.delete(`${hubspotRoutes.HUBDB}/${tableId}/rows/${rowId}/draft`);
    await publishTable({ tableId, apiKey });

    return {
      data
    };

  } catch (err) {
    console.log("Error updating access token:", err.message);
  }
};

const createHubdbTable = async ({ tableName, label = null, columns = [], apiKey = null }) => {
  try {

    const hsClient = createHubspotApiClient(apiKey);

    const payload = {
      name: tableName,
      label: label || tableName,
      columns
    };

    const { data } = await hsClient.post(
      hubspotRoutes.HUBDB,
      payload
    );
    const tableId = data.id;

    publishTable({ tableId, apiKey });

    return {
      data,
      tableId
    };

  } catch (error) {
    console.error("Error creating table:", error);
  }
}
const getHubdbTable = async ({ tableName, apiKey = null }) => {
  try {
    const hsClient = createHubspotApiClient(apiKey);
    const { data } = await hsClient.get(hubspotRoutes.HUBDB);
    const existing = data.results.find(
      (t) => t.name == tableName
    );
    return {
      tableId: existing
        ? existing.id
        : null,
      table: existing || null
    };

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
const getUserAccess = async ({ userId, apiKey = null }) => {
  try {
    const hsClient = createHubspotApiClient(apiKey);
    const { data } = await hsClient.get(`${hubspotRoutes.USERS}/${userId}`);

    return data.superAdmin

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

module.exports = {
  addRowHubdb,
  getTablesRows,
  updateRowHubdb,
  createHubdbTable,
  getHubdbTable,
  getUserAccess,
  deleteRowHubdb
}