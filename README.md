# Support Ticket Management

Manage customer support requests in one place.

A simple application with one ticket management page and one API controller. Sign in with Microsoft to create, view, edit, and delete your own tickets. The page includes search, filters, pagination, expandable details, and New/Edit dialogs.

## Built with

.NET 8, Angular 20, Entity Framework Core, SQL Server, and Microsoft Entra ID.

## Project structure

- **API:** ticket controller and authentication configuration.
- **Core:** ticket entity, request/response models, and service interface.
- **Infrastructure:** ticket service, database context, and migrations.
- **UI:** login page, tickets page, shared form, and API/authentication services.

## Run locally

Install the .NET 8 SDK, Node.js 22.12+ (22.x), and SQL Server.

### 1. Set up Microsoft sign-in

This project uses two Microsoft Entra app registrations in the same tenant:

- **Frontend registration:** identifies the Angular application that signs users in.
- **API registration:** identifies the backend that receives authenticated ticket requests.

An app registration gives an application its own client ID. Use the frontend client ID in the UI and the API client ID in the backend.

In the **API registration**:

1. Open **Expose an API** and set the Application ID URI to `api://<API-client-id>`.
2. Add an enabled scope named `access_as_user`. This permission lets the frontend call the API on behalf of a signed-in user.
3. In **Manifest**, set `api.requestedAccessTokenVersion` to `2`. This makes Microsoft issue version 2 access tokens for this API, matching this project's authentication setup.

In the **frontend registration**:

1. Under **Authentication**, add the **Single-page application (SPA)** platform with redirect URI `http://localhost:4200/`. This is where Microsoft sends the browser after sign-in.
2. Under **API permissions**, add your API's **delegated permission** `access_as_user`. Delegated means the frontend acts on behalf of the signed-in user.
3. Approve the requested permission when prompted. If your tenant requires administrator approval, ask an administrator to grant consent.

The sign-in flow is: **Angular → Microsoft sign-in → Angular receives an access token → Angular sends the token to the API.** The API validates the token and limits ticket access to that user.

### 2. Configure the application

In `SupportTicketManagement.API/SupportTicketManagement.API/appsettings.Development.json`, set:

- `ConnectionStrings:DefaultConnection`: your SQL Server connection string.
- `AzureAd:TenantId`: your Microsoft tenant ID.
- `AzureAd:ClientId`: your API application's client ID.
- `Cors:AllowedOrigins`: `["http://localhost:4200"]`.

In `SupportTicketManagement.UI/src/app/core/config/auth.config.ts`, set:

- `tenantId`: the same tenant ID used by the API.
- `clientId`: the **frontend** application's client ID.
- `apiScope`: `api://<API-client-id>/access_as_user`, matching the scope in **Expose an API**.
- `redirectUri` and `postLogoutRedirectUri`: `http://localhost:4200/`.

### 3. Prepare the database and start the API

Run from the repository root. Install the EF tool once if it is not already installed:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.20
```

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet ef database update --project SupportTicketManagement.API/SupportTicketManagement.Infrastructure --startup-project SupportTicketManagement.API/SupportTicketManagement.API
dotnet run --project SupportTicketManagement.API/SupportTicketManagement.API --launch-profile http
```

API: `http://localhost:5259`. Swagger: `http://localhost:5259/swagger`.

### 4. Start the UI

Open another terminal at the repository root:

```powershell
cd SupportTicketManagement.UI
npm ci
npm start
```

Open `http://localhost:4200/`, sign in, and select **Tickets**.

Description is optional. All ticket operations require authentication and are limited to the signed-in user's tickets. Apply database migrations before saving tickets.
