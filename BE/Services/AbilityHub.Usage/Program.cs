using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AbilityHub.Usage;
using AbilityHub.Usage.Hubs;
using AbilityHub.Usage.Repositories;
using AbilityHub.Usage.Services;
using AbilityHub.ServiceClients;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// Database (owned exclusively by the Usage service)
builder.Services.AddDbContext<UsageDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("UsageDb"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null)));

builder.Services.AddAutoMapper(cfg => cfg.AddProfile<AbilityHub.Usage.Mapping.UsageMappingProfile>());

// Realtime push: when a child reports usage, notify the child's app + watching guardians.
builder.Services.AddSignalR();
builder.Services.AddScoped<IUsageNotifier, UsageNotifier>();

builder.Services.AddScoped<IUsageRepository, UsageRepository>();
builder.Services.AddScoped<IUsageService, UsageService>();
builder.Services.AddScoped<ICheckInRepository, CheckInRepository>();
builder.Services.AddScoped<ICheckInService, CheckInService>();

// Authentication: validate JWTs issued by the Auth service.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };

        // WebSocket clients can't set an Authorization header on the upgrade, so
        // SignalR passes the token as ?access_token=... — read it for hub paths.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Service-to-service clients: guardian authorization (Users) + restriction limits (Settings).
builder.Services.AddUsersServiceClient(builder.Configuration);
builder.Services.AddSettingsServiceClient(builder.Configuration);
builder.Services.AddAppRegistryServiceClient(builder.Configuration);

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UsageDbContext>();
    var retries = 0;

    while (true)
    {
        try
        {
            await db.Database.MigrateAsync();
            break;
        }
        catch
        {
            retries++;
            if (retries > 10)
                throw;
            await Task.Delay(5000);
        }
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<UsageHub>("/hubs/usage");
app.MapHealthChecks("/health");

app.Run();
