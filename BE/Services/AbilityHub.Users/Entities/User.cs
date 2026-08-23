using System.ComponentModel.DataAnnotations.Schema;
using AbilityHub.Shared.Interfaces;

namespace AbilityHub.Users.Entities;

/// <summary>
/// The user profile owned by the Users service. Built from the
/// <c>UserRegistered</c> event; <see cref="Id"/> is the same identifier the
/// Auth service issued, so the two services share one logical user.
/// </summary>
[Table("Users")]
public class User : IAuditable
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }

    /// <summary>
    /// When this guardian first dismissed the introductory help guide; null while they
    /// have not seen it yet. Kept here rather than in browser storage so the guide does
    /// not reappear on every new device or browser the same person signs in from.
    /// A timestamp rather than a flag: it carries the same yes/no answer and additionally
    /// says when, which is useful when reviewing how onboarding is actually used.
    /// </summary>
    public DateTime? HelpGuideSeenAt { get; set; }

    public Guid CreateUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdateUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
