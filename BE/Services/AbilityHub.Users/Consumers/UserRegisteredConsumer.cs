using AutoMapper;
using MassTransit;
using AbilityHub.Shared.Events;
using AbilityHub.Users.Entities;
using AbilityHub.Users.Repositories;

namespace AbilityHub.Users.Consumers;

/// <summary>
/// Reacts to a user being created in the Auth service by materializing a local
/// profile in the Users database. Idempotent: a redelivered event won't create
/// a duplicate profile.
/// </summary>
public class UserRegisteredConsumer(IUserRepository userRepository, IMapper mapper, ILogger<UserRegisteredConsumer> logger)
    : IConsumer<UserRegistered>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<UserRegisteredConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<UserRegistered> context)
    {
        var message = context.Message;

        if (!await _userRepository.ExistsAsync(message.UserId))
        {
            var user = _mapper.Map<User>(message);
            user.CreatedAt = DateTime.UtcNow;

            await _userRepository.AddAsync(user);
            _logger.LogInformation("Created profile for user {UserId} ({Email}).", message.UserId, message.Email);
        }
        else
        {
            _logger.LogInformation("Profile for user {UserId} already exists; skipping create.", message.UserId);
        }

        // Link to guardian if one was supplied (parent created a child) — idempotent.
        if (message.GuardianId is Guid guardianId
            && await _userRepository.ExistsAsync(guardianId)
            && !await _userRepository.LinkExistsAsync(guardianId, message.UserId))
        {
            await _userRepository.AddLinkAsync(new GuardianChild
            {
                GuardianId = guardianId,
                ChildId = message.UserId,
                LinkedAt = DateTime.UtcNow
            });
            _logger.LogInformation("Linked child {ChildId} to guardian {GuardianId}.", message.UserId, guardianId);
        }
    }
}
