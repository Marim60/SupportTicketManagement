using System.Security.Claims;

namespace SupportTicketManagement.API.Security
{
    public static class ClaimsPrincipalExtensions
    {
        public static string GetUserId(this ClaimsPrincipal user) =>
            user.FindFirstValue("oid")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub")
            ?? throw new InvalidOperationException("The access token does not contain a stable user identifier.");
    }
}
