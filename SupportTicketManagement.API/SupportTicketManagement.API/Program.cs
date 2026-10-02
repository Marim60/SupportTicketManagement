using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SupportTicketManagement.Infrastructure;
using System.Text.Json.Serialization;

namespace SupportTicketManagement.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers().AddJsonOptions(options =>
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddInfrastructure(builder.Configuration);

            builder.Services
                   .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                   .AddJwtBearer(options =>
                    {
                        var tenantId = builder.Configuration["AzureAd:TenantId"];
                        var apiClientId = builder.Configuration["AzureAd:ClientId"];

                        options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
                        options.Audience = apiClientId;
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidateAudience = true,
                            ValidateLifetime = true,
                            NameClaimType = "name"
                        };
                    });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("access_as_user", policy =>
                {
                    policy.RequireAuthenticatedUser();
                    policy.RequireAssertion(context => context.User.Claims
                        .Where(claim => claim.Type is "scp" or "http://schemas.microsoft.com/identity/claims/scope")
                        .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                        .Contains("access_as_user", StringComparer.Ordinal));
                });
            });
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Angular", policy => policy
                    .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
                    .AllowAnyHeader()
                    .AllowAnyMethod());
            });
            
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            
            app.UseRouting();
            app.UseCors("Angular");
            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
