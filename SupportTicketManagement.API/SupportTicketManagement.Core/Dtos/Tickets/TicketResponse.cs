using static SupportTicketManagement.Core.Enums;

namespace SupportTicketManagement.Core.Dtos.Tickets
{
    public sealed record TicketResponse(
    int Id,
    string Title,
    string? Description,
    string CustomerEmail,
    Priority Priority,
    Status Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
}
