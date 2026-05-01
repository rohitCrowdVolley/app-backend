const { getTablesRows, getUserAccess } = require("../../services/hubspot/hubspot.service.api")

const getAccessToken = async ({ portalId }) => {
    try {
        const rows = await getTablesRows({ tableId: process.env.HS_HUB_TABLE_ID, filter: `portal_id=${portalId}` });

        return rows?.[0]?.values?.access_token || null;

    } catch (err) {
        return null;
    }
};
const getFilters = (req) => {
    const parseDate = (dateStr, isEndDate = false) => {
        if (!dateStr) return null;

        const [day, month, year] = dateStr.split('/');

        const date = new Date(year, month - 1, day);

        if (isEndDate) {
            date.setHours(23, 59, 59, 999);
        }

        return date;
    };

    return {
        startDate: parseDate(req.query.startDate),
        endDate: parseDate(req.query.endDate, true),

        user: req.query.user || null,
        status: req.query.status || null,
    };
};
const getUniqueUsers = (sessions) => {
    const map = new Map();

    for (const s of sessions) {
        const v = s.values || {};

        const userId = v.userId;
        const name = v.name;

        if (!userId) continue;

        if (!map.has(userId)) {
            map.set(userId, {
                userId,
                name
            });
        }
    }

    return Array.from(map.values());
};
const filterSessions = (sessions, filters) => {

    const now = new Date();
    const last24HoursStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return sessions.filter(s => {
        const v = s.values || {};

        const loginTime = new Date(v.login_start);
        if (filters.startDate && loginTime < filters.startDate) return false;
        if (filters.endDate && loginTime > filters.endDate) return false;
        if (filters.last24Hours) {
            if (loginTime < last24HoursStart || loginTime > now) return false;
        }

        if (filters.user && String(v.userId) !== String(filters.user)) return false;

        if (filters.status == "true" && v.login_end) return false;
        if (filters.status == "false" && !v.login_end) return false;

        return true;
    });
};
const groupBreaksBySession = (breaks) => {
    const map = {};

    for (const b of breaks) {
        const sessionId = b.values?.session_id?.[0]?.id;
        if (!sessionId) continue;

        if (!map[sessionId]) map[sessionId] = [];
        map[sessionId].push(b.values);
    }

    return map;
};
const calculateBreakTime = (breaks = []) => {
    let total = 0;

    for (const b of breaks) {
        const start = new Date(b.break_start).getTime();
        const end = b.break_end
            ? new Date(b.break_end).getTime()
            : Date.now();

        total += (end - start);
    }

    return total;
};
const formatDurationHM = (ms) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
};

const buildTableData = (sessions, breakMap, type = "user") => {
    const userMap = {};
    const sessionList = [];

    for (const s of sessions) {
        const v = s.values || {};
        const sessionId = s.id;
        const createdAt = s.createdAt;

        const userEmail = v.userEmail;
        const userId = v.userId;
        const name = v.name;

        const loginStart = v.login_start
            ? new Date(v.login_start).getTime()
            : null;

        const loginEnd = v.login_end
            ? new Date(v.login_end).getTime()
            : null;

        const sessionBreaks = breakMap[sessionId] || [];
        const breakMs = calculateBreakTime(sessionBreaks);

        const endTime = loginEnd || Date.now();
        const workingMs = loginStart ? (endTime - loginStart) - breakMs : 0;
        const totalSessionMs = loginStart ? (endTime - loginStart) : 0;

        const sessionData = {
            name,
            sessionId,
            loginTime: loginStart,
            logoutTime: loginEnd,
            totalHours: formatDurationHM(workingMs),
            totalBreaks: sessionBreaks.length,
            breakHours: formatDurationHM(breakMs),
            totalSessionHours: formatDurationHM(totalSessionMs),
            createdAt,
            status: loginEnd ? "Logged Out" : "Active",
            breaks: sessionBreaks
        };
        if (type == "session") {
            sessionList.push(sessionData);
            continue;
        }

        if (!userMap[userEmail]) {
            userMap[userEmail] = {
                userId,
                name,
                userEmail,
                sessions: [],

                lastSession: {
                    loginTime: loginStart,
                    logoutTime: loginEnd,
                    totalHours: formatDurationHM(workingMs),
                    totalSessionSeconds: Math.floor(totalSessionMs / 1000),
                    createdAt,
                    status: loginEnd ? "Logged Out" : "Active"
                },

            };
        }

        const user = userMap[userEmail];

        user.sessions.push(sessionData);
    }
    if (type == "session") {
        return sessionList
    }

    return Object.values(userMap);
};

const fetchAllRows = async ({ tableId, apiKey, filter = "sort=-hs_created_at" }) => {
    try {
        let allRows = [], offset = 0, rows;

        do {
            rows = await getTablesRows({ tableId, apiKey, filter: `${filter}&limit=100&offset=${offset}` });

            allRows.push(...rows);
            offset += 100;

        } while (rows.length === 100);

        return allRows;

    } catch (error) {
        console.error("Error fetching all rows:", error.message);
        return [];
    }
};

const averageTimeDetails = async (req, res) => {
    try {
        const filters = getFilters(req);
        const { portalId, breakTable, sessionTable } = req.query;

        const accessToken = await getAccessToken({ portalId });
        const sessions = await fetchAllRows({ tableId: sessionTable, apiKey: accessToken });

        const breaks = await fetchAllRows({ tableId: breakTable, apiKey: accessToken });

        const filteredSessions = filterSessions(sessions, filters);
        const breakMap = groupBreaksBySession(breaks);
        const users = getUniqueUsers(sessions);
        const tableData = buildTableData(filteredSessions, breakMap);

        return res.status(200).send({
            users,
            tableData
        });

    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).send({
            message: "Failed to fetch dashboard",
            error: error.message
        });
    }
};
const getCheckUserAdmin = async (req, res) => {
    try {
        const { portalId, userId } = req.query;
        const accessToken = await getAccessToken({ portalId });
        const result = await getUserAccess({ userId, apiKey: accessToken })

        return res.status(200).json({ success: true, data: result });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    averageTimeDetails,
    getCheckUserAdmin
};