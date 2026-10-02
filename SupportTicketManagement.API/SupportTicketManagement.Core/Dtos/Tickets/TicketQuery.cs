using System.ComponentModel.DataAnnotations;
using static SupportTicketManagement.Core.Enums;

namespace SupportTicketManagement.Core.Dtos.Tickets
{
    public sealed record TicketQuery
    {
        public string? Search { get; init; }
        public Status? Status { get; init; }
        public Priority? Priority { get; init; }

        [Range(1, int.MaxValue)]
        public int Page { get; init; } = 1;

        [Range(1, 50)]
        public int PageSize { get; init; } = 10;
    }
}
