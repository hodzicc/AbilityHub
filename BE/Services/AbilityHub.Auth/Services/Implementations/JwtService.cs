using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Services.Interfaces;

namespace AbilityHub.Auth.Services.Implementations;

public class JwtService(IConfiguration config) : IJwtService
{
    private readonly IConfiguration _config = config;

    public string GenerateToken(Credential credential)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, credential.Id.ToString()),
            new(ClaimTypes.Email, credential.Email)
        };

        if (credential.Role is not null)
            claims.Add(new Claim(ClaimTypes.Role, credential.Role.Name));

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Access-token lifetime is configurable (Jwt:AccessTokenMinutes); default 8h so a
        // normal sitting doesn't expire mid-use. The refresh token (7d) still bounds the
        // overall session.
        var accessTokenMinutes = _config.GetValue<int?>("Jwt:AccessTokenMinutes") ?? 480;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(accessTokenMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
