// Register the frontend as a Single-page application in Microsoft Entra.
// Add http://localhost:4200/ as a SPA redirect URI and grant the API's delegated scope.
// These values are public identifiers. Never add a client secret to a SPA.
export const authConfig = {
  tenantId: '5b9bc9f5-5e55-49ce-9920-2f2e24cc1eb9',
  clientId: '7847bae5-e900-4634-8a0b-3ab6ddbdb0f2',
  // Assumes the API uses its default Application ID URI: api://<API client ID>.
  // Verify this matches the scope shown on the API's Expose an API page.
  apiScope: 'api://8fe3edc3-d3f9-4610-b97d-5cf6414b76b9/access_as_user',
  redirectUri: 'http://localhost:4200/',
  postLogoutRedirectUri: 'http://localhost:4200/'
} as const;
