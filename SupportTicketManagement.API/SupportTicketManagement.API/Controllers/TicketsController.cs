using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportTicketManagement.API.Security;
using SupportTicketManagement.Core.Dtos.Tickets;
using SupportTicketManagement.Core.Interfaces;

namespace SupportTicketManagement.API.Controllers
{
    [Authorize(Policy = "access_as_user")]
    [ApiController]
    [Route("[controller]/[action]")]
    public sealed class TicketsController(ITicketService ticketService) : ControllerBase
    {
        /// <summary>
        /// Gets the signed-in user's tickets with search, filters, and pagination.
        /// </summary>
        /// <param name="query">Search text, status, priority, page number, and page size.</param>
        /// <param name="cancellationToken">Cancels the operation if the request is aborted.</param>
        /// <returns>200 with the tickets and pagination details, or 400 if the query is invalid.</returns>
        [HttpGet]
        [ProducesResponseType<PagedResult<TicketResponse>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<TicketResponse>>> GetAll([FromQuery] TicketQuery query, CancellationToken cancellationToken)
        {
            var result = await ticketService.GetPagedAsync(User.GetUserId(), query, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Gets a ticket by ID if it belongs to the signed-in user.
        /// </summary>
        /// <param name="id">The ID of the ticket to retrieve.</param>
        /// <param name="cancellationToken">Cancels the operation if the request is aborted.</param>
        /// <returns>200 with the ticket, or 404 if it is not found or belongs to another user.</returns>
        [HttpGet]
        [ProducesResponseType<TicketResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TicketResponse>> GetById(int id, CancellationToken cancellationToken)
        {
            var ticket = await ticketService.GetByIdAsync(id, User.GetUserId(), cancellationToken);
            return ticket is null ? NotFound() : Ok(ticket);
        }

        /// <summary>
        /// Creates a ticket for the signed-in user with an Open status.
        /// </summary>
        /// <param name="request">The title, optional description, customer email, and priority.</param>
        /// <param name="cancellationToken">Cancels the operation if the request is aborted.</param>
        /// <returns>201 with the created ticket, or 400 if the input is invalid.</returns>
        [HttpPost]
        [ProducesResponseType<TicketResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<TicketResponse>> Create(CreateTicketRequest request, CancellationToken cancellationToken)
        {
            var ticket = await ticketService.CreateAsync(request, User.GetUserId(), cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }

        /// <summary>
        /// Updates a ticket's details and status if it belongs to the signed-in user.
        /// </summary>
        /// <param name="id">The ID of the ticket to update.</param>
        /// <param name="request">The replacement title, optional description, customer email, priority, and status. Omitting the description clears it.</param>
        /// <param name="cancellationToken">Cancels the operation if the request is aborted.</param>
        /// <returns>204 if updated, 400 if the input is invalid, or 404 if the ticket is not found or belongs to another user.</returns>
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, UpdateTicketRequest request, CancellationToken cancellationToken)
        {
            var updated = await ticketService.UpdateAsync(id, request, User.GetUserId(), cancellationToken);
            return updated ? NoContent() : NotFound();
        }

        /// <summary>
        /// Deletes a ticket if it belongs to the signed-in user.
        /// </summary>
        /// <param name="id">The ID of the ticket to delete.</param>
        /// <param name="cancellationToken">Cancels the operation if the request is aborted.</param>
        /// <returns>204 if deleted, or 404 if the ticket is not found or belongs to another user.</returns>
        [HttpDelete]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var deleted = await ticketService.DeleteAsync(id, User.GetUserId(), cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
    }
}
