module.exports = {
  AUTH: (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`,
  
  USERS_FILTER_BY_EMAIL: (email) =>
    `/users?$select=id,displayName,mail&$filter=mail eq '${email}'`,

  USER_PRESENCE: (userId) =>
    `/users/${userId}/presence`,
};