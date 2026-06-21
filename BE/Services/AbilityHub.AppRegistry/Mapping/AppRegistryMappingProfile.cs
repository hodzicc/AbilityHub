using AutoMapper;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Mapping;

/// <summary>
/// AutoMapper configuration for the AppRegistry service. Keeps the controller/service
/// free of hand-written field-by-field copying. The few non-trivial bits (flattening
/// the related application onto the child-assignment response) are expressed here.
/// </summary>
public class AppRegistryMappingProfile : Profile
{
    public AppRegistryMappingProfile()
    {
        // Catalog entity → response (field names line up one-to-one).
        CreateMap<Application, ApplicationResponse>();

        // Child assignment → response: flatten the related application's key/name.
        // ApplicationId and AssignedAt map by name.
        CreateMap<ChildApplication, ChildApplicationResponse>()
            .ForMember(d => d.Key, o => o.MapFrom(s => s.Application != null ? s.Application.Key : string.Empty))
            .ForMember(d => d.Name, o => o.MapFrom(s => s.Application != null ? s.Application.Name : string.Empty));
    }
}
