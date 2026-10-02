using static SupportTicketManagement.Core.Enums;

namespace SupportTicketManagement.Core.Entities
{
    public sealed class Ticket
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CustomerEmail { get; set; } = string.Empty;
        public Priority Priority { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
    }
}
