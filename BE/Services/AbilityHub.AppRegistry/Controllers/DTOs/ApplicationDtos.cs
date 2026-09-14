using System.ComponentModel.DataAnnotations;

namespace AbilityHub.AppRegistry.Controllers.DTOs;

public class RegisterApplicationRequest : IValidatableObject
{
    [Required, StringLength(100)]
    public required string Key { get; set; }

    [Required, StringLength(200)]
    public required string Name { get; set; }

    [StringLength(50)]
    public string Platform { get; set; } = "Mobile";

    [StringLength(50)]
    public string Version { get; set; } = string.Empty;

    [StringLength(100)]
    public string DataFormat { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(100)]
    public string Category { get; set; } = string.Empty;

    [StringLength(100)]
    public string IconName { get; set; } = "AppWindow";

    [StringLength(30)]
    public string Color { get; set; } = "#4F46E5";

    [Range(0, 120)]
    public int MinAge { get; set; } = 0;

    [Range(0, 120)]
    public int MaxAge { get; set; } = 18;

    [StringLength(4000)]
    public string FeaturesJson { get; set; } = "[]";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        => AgeRangeValidation.Check(MinAge, MaxAge);
}

public class UpdateApplicationRequest : IValidatableObject
{
    [Required, StringLength(200)]
    public required string Name { get; set; }

    [StringLength(50)]
    public string Platform { get; set; } = "Mobile";

    [StringLength(50)]
    public string Version { get; set; } = string.Empty;

    [StringLength(100)]
    public string DataFormat { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [StringLength(100)]
    public string Category { get; set; } = string.Empty;

    [StringLength(100)]
    public string IconName { get; set; } = "AppWindow";

    [StringLength(30)]
    public string Color { get; set; } = "#4F46E5";

    [Range(0, 120)]
    public int MinAge { get; set; } = 0;

    [Range(0, 120)]
    public int MaxAge { get; set; } = 18;

    [StringLength(4000)]
    public string FeaturesJson { get; set; } = "[]";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        => AgeRangeValidation.Check(MinAge, MaxAge);
}

internal static class AgeRangeValidation
{
    public static IEnumerable<ValidationResult> Check(int minAge, int maxAge)
    {
        if (maxAge < minAge)
            yield return new ValidationResult(
                "MaxAge must be greater than or equal to MinAge.", new[] { nameof(RegisterApplicationRequest.MaxAge) });
    }
}

public class ApplicationResponse
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string DataFormat { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Category { get; set; } = string.Empty;
    public string IconName { get; set; } = "AppWindow";
    public string Color { get; set; } = "#4F46E5";
    public int MinAge { get; set; }
    public int MaxAge { get; set; }
    public string FeaturesJson { get; set; } = "[]";
}

public class AssignAppRequest
{
    public Guid ApplicationId { get; set; }
}

public class ChildApplicationResponse
{
    public Guid ApplicationId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

/// <summary>One child's assignment of a given app — the reverse of
/// <see cref="ChildApplicationResponse"/> (which apps a child has); this is which
/// children have a given app, for the app-centric admin view.</summary>
public class AppAssignmentResponse
{
    public Guid ChildId { get; set; }
    public DateTime AssignedAt { get; set; }
}
