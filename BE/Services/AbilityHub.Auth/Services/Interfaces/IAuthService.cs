using AbilityHub.Auth.Controllers.DTOs;

namespace AbilityHub.Auth.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(AuthRequest request);
    Task<AuthResponse> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(RefreshRequest request);

    /// <summary>
    /// Issues a short-lived, single-use QR pairing token for a child credential
    /// (used by mobile apps to log in by scanning instead of typing). Returns
    /// <c>null</c> if the id is not an active child account.
    /// </summary>
    Task<PairingTokenResponse?> CreatePairingTokenAsync(Guid childId);

    /// <summary>
    /// Redeems a pairing token (must exist, be unexpired and unused) and returns a
    /// normal access/refresh token pair for that child — same shape as login.
    /// </summary>
    Task<AuthResponse> ExchangePairingTokenAsync(PairingExchangeRequest request);
}
