using AbilityHub.Auth.Entities;

namespace AbilityHub.Auth.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(Credential credential);
    }
}
