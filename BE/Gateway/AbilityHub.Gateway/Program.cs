using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AbilityHub.Shared.Common;

var builder = WebApplication.CreateBuilder(args);

// Single entry point: reverse-proxy all /api/* traffic to the services.
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Validate JWTs at the edge (services re-validate + enforce roles — defense in depth).
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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Ensure every request carries a correlation id; YARP forwards it downstream.
app.Use(async (context, next) =>
{
    if (!context.Request.Headers.TryGetValue(CorrelationConstants.HeaderName, out var correlationId)
        || string.IsNullOrWhiteSpace(correlationId))
    {
        correlationId = Guid.NewGuid().ToString();
        context.Request.Headers[CorrelationConstants.HeaderName] = correlationId!;
    }

    context.Response.Headers[CorrelationConstants.HeaderName] = correlationId!;
    await next();
});

app.MapHealthChecks("/health");

// Aggregated Swagger UI: one page documenting every service behind the gateway.
// Each service's swagger.json is fetched through the anonymous /api-docs/* proxy
// routes (see appsettings.json), so the single gateway port is all you need.
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/api-docs/auth", "Auth API");
    options.SwaggerEndpoint("/api-docs/users", "Users API");
    options.SwaggerEndpoint("/api-docs/apps", "App Registry API");
    options.SwaggerEndpoint("/api-docs/settings", "Settings API");
    options.SwaggerEndpoint("/api-docs/usage", "Usage API");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "AbilityHub API Gateway";
});

// Hitting the gateway root drops you straight onto Swagger.
app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();

app.Run();
