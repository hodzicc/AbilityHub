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

    public Guid CreateUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdateUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
