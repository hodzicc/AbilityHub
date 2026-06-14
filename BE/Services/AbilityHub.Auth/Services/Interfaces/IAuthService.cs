using AbilityHub.Auth.Controllers.DTOs;

namespace AbilityHub.Auth.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(AuthRequest request);
    Task<AuthResponse> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(RefreshRequest request);
}
