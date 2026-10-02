using SupportTicketManagement.Core.Dtos.Tickets;

namespace SupportTicketManagement.Core.Interfaces
{
    public interface ITicketService
    {
        Task<PagedResult<TicketResponse>> GetPagedAsync(string userId, TicketQuery query, CancellationToken cancellationToken);
        Task<TicketResponse?> GetByIdAsync(int id, string userId, CancellationToken cancellationToken);
        Task<TicketResponse> CreateAsync(CreateTicketRequest request, string userId, CancellationToken cancellationToken);
        Task<bool> UpdateAsync(int id, UpdateTicketRequest request, string userId, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, string userId, CancellationToken cancellationToken);
    }
}
