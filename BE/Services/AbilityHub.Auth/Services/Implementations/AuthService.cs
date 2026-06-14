using System.Security.Cryptography;
using System.Text;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;
using AbilityHub.Auth.Security;

namespace AbilityHub.Auth.Services.Implementations;

public class AuthService(
    IJwtService jwtService,
    ICredentialRepository credentialRepository,
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher) : IAuthService
{
    private readonly IJwtService _jwtService = jwtService;
    private readonly ICredentialRepository _credentialRepository = credentialRepository;
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPasswordHasher _passwordHasher = passwordHasher;

    public async Task<AuthResponse> LoginAsync(AuthRequest request)
    {
        var credential = await _credentialRepository.GetByEmailAsync(request.Email);

        if (credential == null || !_passwordHasher.Verify(request.Password, credential.PasswordHash))
            return new AuthResponse { Success = false, Message = "Invalid credentials" };

        if (!credential.IsActive)
            return new AuthResponse { Success = false, Message = "Account is deactivated" };

        return await IssueTokensAsync(credential);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request)
    {
        // Only the hash of the refresh token is stored, so look up by hash.
        var existing = await _authRepository.GetByTokenAsync(HashToken(request.RefreshToken));

        if (existing == null || existing.IsRevoked || existing.ExpiresAt <= DateTime.UtcNow)
            return new AuthResponse { Success = false, Message = "Invalid refresh token" };

        // Rotate: revoke the presented token before issuing a new one.
        existing.IsRevoked = true;
        await _authRepository.UpdateAsync(existing);

        var credential = await _credentialRepository.GetByIdAsync(existing.UserId);

        if (credential == null)
            return new AuthResponse { Success = false, Message = "Invalid refresh token" };

        return await IssueTokensAsync(credential);
    }

    public async Task LogoutAsync(RefreshRequest request)
    {
        var existing = await _authRepository.GetByTokenAsync(HashToken(request.RefreshToken));

        if (existing == null || existing.IsRevoked)
            return;

        existing.IsRevoked = true;
        await _authRepository.UpdateAsync(existing);
    }

    private async Task<AuthResponse> IssueTokensAsync(Credential credential)
    {
        var accessToken = _jwtService.GenerateToken(credential);

        // The plaintext token goes to the client; the database only ever sees its hash.
        var plaintextRefreshToken = GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = HashToken(plaintextRefreshToken),
            UserId = credential.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        await _authRepository.AddAsync(refreshToken);

        return new AuthResponse
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = plaintextRefreshToken
        };
    }

    private static string GenerateRefreshToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    // Refresh tokens are high-entropy random values, so a fast hash is sufficient
    // to make stored tokens useless if the database is leaked.
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
