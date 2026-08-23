namespace AbilityHub.Users.Controllers.DTOs;

public class UserProfileResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    /// <summary>Null until the guardian has dismissed the introductory help guide.</summary>
    public DateTime? HelpGuideSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
