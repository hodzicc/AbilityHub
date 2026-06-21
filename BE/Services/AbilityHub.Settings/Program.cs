using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AbilityHub.Settings;
using AbilityHub.Settings.Consumers;
using AbilityHub.Settings.Hubs;
using AbilityHub.Settings.Repositories;
using AbilityHub.Settings.Services;
using AbilityHub.MessageBus;
using AbilityHub.ServiceClients;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// Realtime push (SignalR): the mobile/web app connects and the server pushes
// restriction/preference changes to the affected child instantly.
builder.Services.AddSignalR();
builder.Services.AddScoped<ISettingsNotifier, SettingsNotifier>();

// Database (owned exclusively by the Settings service)
builder.Services.AddDbContext<SettingsDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("SettingsDb"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null)));

builder.Services.AddScoped<IPreferenceRepository, PreferenceRepository>();
builder.Services.AddScoped<IRestrictionRepository, RestrictionRepository>();
builder.Services.AddScoped<ISettingsService, SettingsService>();

builder.Services.AddAutoMapper(cfg => cfg.AddProfile<AbilityHub.Settings.Mapping.SettingsMappingProfile>());

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

        // WebSocket clients can't send an Authorization header on the upgrade
        // request, so SignalR passes the token as ?access_token=... — read it for hub paths.
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

// Service-to-service client for guardian↔child authorization checks.
builder.Services.AddUsersServiceClient(builder.Configuration);

// Message bus: react to app assignment changes from AppRegistry.
builder.Services.AddAbilityHubMessageBus(builder.Configuration,
    x =>
    {
        x.AddConsumer<AppAssignedToChildConsumer>();
        x.AddConsumer<AppRemovedFromChildConsumer>();
    });

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SettingsDbContext>();
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
app.MapHub<SettingsHub>("/hubs/settings");
app.MapHealthChecks("/health");

app.Run();
