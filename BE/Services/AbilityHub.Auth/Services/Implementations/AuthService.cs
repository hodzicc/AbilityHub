using System.Security.Cryptography;
using System.Text;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;
using AbilityHub.Auth.Security;
using AbilityHub.Shared.Common;

namespace AbilityHub.Auth.Services.Implementations;

public class AuthService(
    IJwtService jwtService,
    ICredentialRepository credentialRepository,
    IAuthRepository authRepository,
    IPairingTokenRepository pairingTokenRepository,
    IPasswordHasher passwordHasher) : IAuthService
{
    // QR pairing codes are meant to be scanned promptly, so they live briefly.
    private static readonly TimeSpan PairingTokenLifetime = TimeSpan.FromMinutes(5);

    private readonly IJwtService _jwtService = jwtService;
    private readonly ICredentialRepository _credentialRepository = credentialRepository;
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPairingTokenRepository _pairingTokenRepository = pairingTokenRepository;
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

    public async Task<PairingTokenResponse?> CreatePairingTokenAsync(Guid childId)
    {
        var credential = await _credentialRepository.GetByIdAsync(childId);

        // Only active child accounts can be paired to a device this way.
        if (credential is null || !credential.IsActive || credential.RoleId != Roles.ChildId)
            return null;

        // The plaintext goes into the QR code; the database only ever sees its hash.
        var plaintext = GenerateOpaqueToken();
        var expiresAt = DateTime.UtcNow.Add(PairingTokenLifetime);

        await _pairingTokenRepository.AddAsync(new PairingToken
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            TokenHash = HashToken(plaintext),
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        });

        return new PairingTokenResponse { Token = plaintext, ExpiresAt = expiresAt };
    }

    public async Task<AuthResponse> ExchangePairingTokenAsync(PairingExchangeRequest request)
    {
        var token = await _pairingTokenRepository.GetByHashAsync(HashToken(request.Token));

        if (token is null || token.IsUsed || token.ExpiresAt <= DateTime.UtcNow)
            return new AuthResponse { Success = false, Message = "Invalid or expired pairing token" };

        var credential = await _credentialRepository.GetByIdAsync(token.ChildId);

        if (credential is null || !credential.IsActive)
            return new AuthResponse { Success = false, Message = "Account is unavailable" };

        // Single use: burn the token before issuing a session so a replayed scan fails.
        token.IsUsed = true;
        await _pairingTokenRepository.UpdateAsync(token);

        return await IssueTokensAsync(credential);
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

    private static string GenerateRefreshToken() => GenerateOpaqueToken();

    // A high-entropy random value, safe to use as a bearer-style secret (refresh /
    // pairing token). Only its hash is ever persisted.
    private static string GenerateOpaqueToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    // Refresh tokens are high-entropy random values, so a fast hash is sufficient
    // to make stored tokens useless if the database is leaked.
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
