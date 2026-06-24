using AutoMapper;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Entities;
using AbilityHub.Usage.Repositories;

namespace AbilityHub.Usage.Mapping;

/// <summary>
/// AutoMapper configuration for the Usage service. Keeps the controller/service
/// free of hand-written field-by-field copying. The few non-trivial bits
/// (defaulting ids/timestamps, flattening the metrics object, omitting an
/// all-null metrics object) are expressed declaratively here.
/// </summary>
public class UsageMappingProfile : Profile
{
    public UsageMappingProfile()
    {
        // Incoming activity (ingestion) → entity. ChildId/ApplicationId come from
        // the request context, so they're set by the service, not mapped.
        CreateMap<ActivityDto, ActivityRecord>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.Id ?? Guid.NewGuid()))
            .ForMember(d => d.OccurredAt, o => o.MapFrom(s => s.OccurredAt == default ? DateTime.UtcNow : s.OccurredAt))
            .ForMember(d => d.ChildId, o => o.Ignore())
            .ForMember(d => d.ApplicationId, o => o.Ignore())
            .ForMember(d => d.StartedViaAction, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.StartedViaAction : null))
            .ForMember(d => d.CompletedViaAction, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.CompletedViaAction : null))
            .ForMember(d => d.StepsCompleted, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.StepsCompleted : null))
            .ForMember(d => d.StepsTotal, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.StepsTotal : null))
            .ForMember(d => d.DurationSeconds, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.DurationSeconds : null))
            .ForMember(d => d.HintsShown, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.HintsShown : null))
            .ForMember(d => d.ErrorsCount, o => o.MapFrom(s => s.Metrics != null ? s.Metrics.ErrorsCount : null));

        // In-place update of a tracked activity (live step progress). Identity and
        // ownership stay as they are on the existing row; everything else is overwritten.
        CreateMap<ActivityRecord, ActivityRecord>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ChildId, o => o.Ignore())
            .ForMember(d => d.ApplicationId, o => o.Ignore())
            .ForMember(d => d.Attributes, o => o.Ignore()); // computed; AttributesJson carries the data

        // Entity → metrics DTO (field names line up one-to-one).
        CreateMap<ActivityRecord, ActivityMetricsDto>();

        // Entity → dashboard activity. The nested metrics object is dropped when the
        // app reported no metric at all, so "no data" is distinct from "all zeros".
        CreateMap<ActivityRecord, RecentActivityDto>()
            .ForMember(d => d.Metrics, o => o.MapFrom(s => s))
            .AfterMap((src, dest) =>
            {
                var hasAny = src.StartedViaAction is not null || src.CompletedViaAction is not null
                    || src.StepsCompleted is not null || src.StepsTotal is not null
                    || src.DurationSeconds is not null || src.HintsShown is not null || src.ErrorsCount is not null;
                if (!hasAny) dest.Metrics = null;
            });

        // Per-app aggregate → dashboard row (seconds → minutes, rounded up so any
        // nonzero usage shows as at least 1 minute instead of disappearing to 0).
        CreateMap<AppUsageAggregate, AppUsageDto>()
            .ForMember(d => d.TotalMinutes, o => o.MapFrom(s => (s.TotalSeconds + 59) / 60));

        // Weekly parent check-ins. Id (Guid → string) converts automatically.
        CreateMap<WeeklyCheckIn, WeeklyCheckInResponse>();

        // Request → entity for create/update. The service owns identity and
        // timestamps, so those are not mapped from the request.
        CreateMap<WeeklyCheckInRequest, WeeklyCheckIn>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ChildId, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore());
    }
}
