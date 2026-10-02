using Microsoft.EntityFrameworkCore;
using SupportTicketManagement.Core.Dtos.Tickets;
using SupportTicketManagement.Core.Entities;
using SupportTicketManagement.Core.Interfaces;
using static SupportTicketManagement.Core.Enums;

namespace SupportTicketManagement.Infrastructure.Services
{
    public sealed class TicketService(ApplicationDbContext context, TimeProvider timeProvider) : ITicketService
    {
        #region Public Methods
        public async Task<PagedResult<TicketResponse>> GetPagedAsync(string userId, TicketQuery query, CancellationToken cancellationToken)
        {
            var tickets = context.Tickets
                .AsNoTracking()
                .Where(ticket => ticket.CreatedByUserId == userId);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();
                tickets = tickets.Where(ticket =>
                    ticket.Title.Contains(search) ||
                    ticket.CustomerEmail.Contains(search));
            }

            if (query.Status.HasValue)
            {
                tickets = tickets.Where(ticket => ticket.Status == query.Status.Value);
            }

            if (query.Priority.HasValue)
            {
                tickets = tickets.Where(ticket => ticket.Priority == query.Priority.Value);
            }

            var totalCount = await tickets.CountAsync(cancellationToken);
            var entities = await tickets
                .OrderByDescending(ticket => ticket.CreatedAt)
                .ThenByDescending(ticket => ticket.Id)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);
            var items = entities.Select(ToResponse).ToList();

            return new PagedResult<TicketResponse>(items, query.Page, query.PageSize, totalCount);
        }

        public async Task<TicketResponse?> GetByIdAsync(int id, string userId, CancellationToken cancellationToken)
        {
            var ticket = await context.Tickets
                .AsNoTracking()
                .Where(ticket => ticket.Id == id && ticket.CreatedByUserId == userId)
                .SingleOrDefaultAsync(cancellationToken);
            return ticket is null ? null : ToResponse(ticket);
        } 
    
        public async Task<TicketResponse> CreateAsync(CreateTicketRequest request, string userId, CancellationToken cancellationToken)
        {
            var ticket = new Ticket
            {
                Title = request.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                CustomerEmail = request.CustomerEmail.Trim().ToLowerInvariant(),
                Priority = request.Priority,
                Status = Status.Open,
                CreatedAt = timeProvider.GetUtcNow().UtcDateTime,
                CreatedByUserId = userId
            };

            context.Tickets.Add(ticket);
            await context.SaveChangesAsync(cancellationToken);

            return ToResponse(ticket);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTicketRequest request, string userId, CancellationToken cancellationToken)
        {
            var ticket = await context.Tickets.SingleOrDefaultAsync(
                item => item.Id == id && item.CreatedByUserId == userId,
                cancellationToken);

            if (ticket is null)
            {
                return false;
            }

            ticket.Title = request.Title.Trim();
            ticket.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            ticket.CustomerEmail = request.CustomerEmail.Trim().ToLowerInvariant();
            ticket.Priority = request.Priority;
            ticket.Status = request.Status;
            ticket.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> DeleteAsync(int id, string userId, CancellationToken cancellationToken)
        {
            var ticket = await context.Tickets.SingleOrDefaultAsync(
                item => item.Id == id && item.CreatedByUserId == userId,
                cancellationToken);

            if (ticket is null)
            {
                return false;
            }

            context.Tickets.Remove(ticket);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        #endregion

        #region Private Methods
        private static TicketResponse ToResponse(Ticket ticket)
        {
            return new TicketResponse(
                ticket.Id,
                ticket.Title,
                ticket.Description,
                ticket.CustomerEmail,
                ticket.Priority,
                ticket.Status,
                ticket.CreatedAt,
                ticket.UpdatedAt);
        }
        #endregion
    }
}
