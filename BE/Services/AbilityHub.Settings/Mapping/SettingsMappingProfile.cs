using AutoMapper;
using AbilityHub.Settings.Controllers.DTOs;
using AbilityHub.Settings.Entities;

namespace AbilityHub.Settings.Mapping;

/// <summary>
/// AutoMapper configuration for the Settings service. Keeps the service free of
/// hand-written field-by-field copying for straight entity→DTO maps.
/// </summary>
public class SettingsMappingProfile : Profile
{
    public SettingsMappingProfile()
    {
        // Entity → DTO (field names line up one-to-one).
        CreateMap<AppRestriction, RestrictionResponse>();
    }
}
