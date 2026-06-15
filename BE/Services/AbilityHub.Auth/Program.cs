using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AbilityHub.Auth;
using AbilityHub.Auth.Data;
using AbilityHub.Auth.Security;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Auth.Services.Implementations;
using AbilityHub.Auth.Repositories.Interfaces;
using AbilityHub.Auth.Repositories.Implementations;
using AbilityHub.Users.Services;
using AbilityHub.MessageBus;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AuthDb"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            );
        }
    )
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        p => p.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Authentication: validate the JWTs this service issues.
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
    });

builder.Services.AddAuthorization();
builder.Services.AddHealthChecks();

// Throttle authentication endpoints to slow credential brute-forcing.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromSeconds(30),
                QueueLimit = 0
            }));
});

builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<ICredentialRepository, CredentialRepository>();

// Message bus (publish-only here: Auth announces UserRegistered).
builder.Services.AddAbilityHubMessageBus(builder.Configuration);

var app = builder.Build();

// Apply migrations + seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

    var retries = 0;

    while (true)
    {
        try
        {
            await db.Database.MigrateAsync();
            await RoleSeedData.InitializeAsync(db);
            await AdminSeedData.InitializeAsync(db, passwordHasher, app.Configuration, publishEndpoint);
            await DemoSeedData.InitializeAsync(db, passwordHasher, publishEndpoint);
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

// Configure middleware
app.UseSwagger();
app.UseSwaggerUI();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
