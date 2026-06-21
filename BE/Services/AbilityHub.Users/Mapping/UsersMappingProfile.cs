using AutoMapper;
using AbilityHub.Users.Controllers.DTOs;
using AbilityHub.Users.Entities;
using AbilityHub.Shared.Events;

namespace AbilityHub.Users.Mapping;

/// <summary>
/// AutoMapper configuration for the Users service. Keeps the controller and the
/// event consumer free of hand-written field-by-field copying.
/// </summary>
public class UsersMappingProfile : Profile
{
    public UsersMappingProfile()
    {
        // Entity → read DTO (names line up).
        CreateMap<User, UserProfileResponse>();

        // Update request → existing entity. FirstName/LastName always apply;
        // DateOfBirth/Gender only when provided (so they aren't nulled out); the
        // rest are owned by the service/identity and never overwritten here.
        CreateMap<UpdateProfileRequest, User>()
            .ForMember(d => d.DateOfBirth, o => o.Condition(s => s.DateOfBirth.HasValue))
            .ForMember(d => d.Gender, o => o.Condition(s => s.Gender != null))
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.Email, o => o.Ignore())
            .ForMember(d => d.RoleId, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.CreateUserId, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdateUserId, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore());

        // Integration event → new profile. CreatedAt is stamped by the consumer.
        CreateMap<UserRegistered, User>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.UserId))
            .ForMember(d => d.CreateUserId, o => o.MapFrom(s => s.GuardianId ?? s.UserId))
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.IsActive, o => o.Ignore())
            .ForMember(d => d.UpdateUserId, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore());
    }
}
