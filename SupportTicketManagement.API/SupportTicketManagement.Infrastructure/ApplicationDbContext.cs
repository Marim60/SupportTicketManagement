using Microsoft.EntityFrameworkCore;
using SupportTicketManagement.Core.Entities;

namespace SupportTicketManagement.Infrastructure
{
    public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Ticket> Tickets => Set<Ticket>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var ticket = modelBuilder.Entity<Ticket>();

            ticket.ToTable("Ticket");
            ticket.HasKey(x => x.Id);
            ticket.Property(x => x.Title).HasMaxLength(150).IsRequired();
            ticket.Property(x => x.Description).HasMaxLength(2000).IsRequired(false);
            ticket.Property(x => x.CustomerEmail).HasMaxLength(320).IsRequired();
            ticket.Property(x => x.CreatedByUserId).HasMaxLength(200).IsRequired();
            ticket.Property(x => x.Priority).HasConversion<string>().HasMaxLength(20);
            ticket.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            ticket.HasIndex(x => new { x.CreatedByUserId, x.Status });
            ticket.HasIndex(x => new { x.CreatedByUserId, x.CreatedAt });
        }
    }
}
