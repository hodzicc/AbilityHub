using MassTransit;
using Microsoft.EntityFrameworkCore;
using AbilityHub.Auth;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;
using AbilityHub.Auth.Security;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Shared.Events;

namespace AbilityHub.Users.Services;

/// <summary>
/// Owns user lifecycle from the Auth (identity) side: creates the credential
/// — the single login that works across every app — and deactivates accounts.
/// Changes are announced to the rest of the platform via integration events.
/// </summary>
public class UserService(
    AuthDbContext context,
    ICredentialRepository credentialRepository,
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    IPublishEndpoint publishEndpoint) : IUserService
{
    private readonly AuthDbContext _context = context;
    private readonly ICredentialRepository _credentialRepository = credentialRepository;
    private readonly IAuthRepository _authRepository = authRepository;
    private readonly IPasswordHasher _passwordHasher = passwordHasher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public async Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, Guid? guardianId)
    {
        if (await _credentialRepository.ExistsByEmailAsync(request.Email))
            return new CreateUserResponse { Success = false, Message = "A user with this email already exists" };

        var roleExists = await _context.Roles.AnyAsync(r => r.Id == request.RoleId);
        if (!roleExists)
            return new CreateUserResponse { Success = false, Message = "Invalid role" };

        var credential = new Credential
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            RoleId = request.RoleId
        };

        await _credentialRepository.AddAsync(credential);

        // Announce the new user so other services (Users, Settings, ...) can
        // build their own data keyed by the same UserId. Password never leaves Auth.
        await _publishEndpoint.Publish(new UserRegistered(
            credential.Id,
            request.Email,
            request.FirstName,
            request.LastName,
            request.RoleId,
            guardianId));

        return new CreateUserResponse
        {
            Success = true,
            UserId = credential.Id,
            Message = "User created"
        };
    }

    public async Task<bool> DeactivateUserAsync(Guid userId)
    {
        var credential = await _credentialRepository.GetByIdAsync(userId);
        if (credential is null || !credential.IsActive)
            return false;

        credential.IsActive = false;
        await _credentialRepository.UpdateAsync(credential);

        // Cut off existing sessions and tell the rest of the platform.
        await _authRepository.RevokeAllForUserAsync(userId);
        await _publishEndpoint.Publish(new UserDeactivated(userId));

        return true;
    }
}
