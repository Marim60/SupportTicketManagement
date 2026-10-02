using System.ComponentModel.DataAnnotations;
using static SupportTicketManagement.Core.Enums;

namespace SupportTicketManagement.Core.Dtos.Tickets
{
    public sealed record UpdateTicketRequest
    {
        [Required, MaxLength(150)]
        public required string Title { get; init; }

        [MaxLength(2000)]
        public string? Description { get; init; }

        [Required, EmailAddress, MaxLength(320)]
        public required string CustomerEmail { get; init; }

        [EnumDataType(typeof(Priority))]
        public Priority Priority { get; init; }

        [EnumDataType(typeof(Status))]
        public Status Status { get; init; }
    }

}
