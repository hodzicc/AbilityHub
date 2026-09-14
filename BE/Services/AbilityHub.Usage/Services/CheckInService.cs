using AutoMapper;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Entities;
using AbilityHub.Usage.Repositories;

namespace AbilityHub.Usage.Services;

public class CheckInService(ICheckInRepository repository, IMapper mapper) : ICheckInService
{
    private readonly ICheckInRepository _repository = repository;
    private readonly IMapper _mapper = mapper;

    public async Task<WeeklyCheckInResponse> SubmitAsync(Guid childId, WeeklyCheckInRequest request)
    {
        // Upsert: one evaluation per child per week, so re-submitting edits it in place.
        var existing = await _repository.GetByWeekAsync(childId, request.WeekStartDate);

        if (existing is null)
        {
            var created = new WeeklyCheckIn
            {
                Id = Guid.NewGuid(),
                ChildId = childId,
                WeekStartDate = request.WeekStartDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _mapper.Map(request, created);
            await _repository.AddAsync(created);
            return _mapper.Map<WeeklyCheckInResponse>(created);
        }

        _mapper.Map(request, existing);
        existing.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(existing);
        return _mapper.Map<WeeklyCheckInResponse>(existing);
    }

    public async Task<IReadOnlyList<WeeklyCheckInResponse>> GetForChildAsync(Guid childId)
    {
        var items = await _repository.GetForChildAsync(childId);
        return _mapper.Map<List<WeeklyCheckInResponse>>(items);
    }

    public async Task<IReadOnlyList<Guid>> GetChildrenMissingCheckInAsync(IReadOnlyCollection<Guid> childIds, DateOnly weekStart)
    {
        if (childIds.Count == 0) return [];

        var present = (await _repository.GetChildIdsWithCheckInForWeekAsync(childIds, weekStart)).ToHashSet();
        return childIds.Where(id => !present.Contains(id)).ToList();
    }

    public async Task<bool> DeleteAsync(Guid childId, Guid checkInId)
    {
        var existing = await _repository.GetByIdAsync(checkInId);
        // Guard against deleting another child's evaluation via a guessed id.
        if (existing is null || existing.ChildId != childId) return false;

        await _repository.DeleteAsync(existing);
        return true;
    }
}
