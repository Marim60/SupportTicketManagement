using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SupportTicketManagement.Core.Interfaces;
using SupportTicketManagement.Infrastructure.Services;

namespace SupportTicketManagement.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddSingleton(TimeProvider.System);
            services.AddScoped<ITicketService, TicketService>();

            return services;
        }
    }
}
