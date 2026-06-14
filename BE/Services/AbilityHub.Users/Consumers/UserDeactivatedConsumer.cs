using MassTransit;
using AbilityHub.Shared.Events;
using AbilityHub.Users.Repositories;

namespace AbilityHub.Users.Consumers;

/// <summary>
/// Reacts to an account being deactivated in the Auth service by disabling the
/// local profile. Idempotent.
/// </summary>
public class UserDeactivatedConsumer(IUserRepository userRepository, ILogger<UserDeactivatedConsumer> logger)
    : IConsumer<UserDeactivated>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly ILogger<UserDeactivatedConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<UserDeactivated> context)
    {
        var user = await _userRepository.GetByIdAsync(context.Message.UserId);

        if (user is null || !user.IsActive)
            return;

        user.IsActive = false;
        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("Deactivated profile for user {UserId}.", context.Message.UserId);
    }
}
