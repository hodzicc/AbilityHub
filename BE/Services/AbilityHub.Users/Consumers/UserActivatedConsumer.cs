using MassTransit;
using AbilityHub.Shared.Events;
using AbilityHub.Users.Repositories;

namespace AbilityHub.Users.Consumers;

/// <summary>
/// Reacts to an account being reactivated in the Auth service by re-enabling
/// the local profile. Idempotent.
/// </summary>
public class UserActivatedConsumer(IUserRepository userRepository, ILogger<UserActivatedConsumer> logger)
    : IConsumer<UserActivated>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly ILogger<UserActivatedConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<UserActivated> context)
    {
        var user = await _userRepository.GetByIdAsync(context.Message.UserId);

        if (user is null || user.IsActive)
            return;

        user.IsActive = true;
        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("Activated profile for user {UserId}.", context.Message.UserId);
    }
}
