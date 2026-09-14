using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Auth.Controllers.DTOs;

public class CreateUserRequest
{
    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; set; }

    // Minimum length matches the web registration form (6) so the two agree.
    [Required, StringLength(128, MinimumLength = 6)]
    public required string Password { get; set; }

    [Required, StringLength(100)]
    public required string FirstName { get; set; }

    [Required, StringLength(100)]
    public required string LastName { get; set; }

    /// <summary>Role to assign: 1 = Admin, 2 = Parent, 3 = Child (see RoleSeedData).
    /// Overridden by the server for the register/parent-creates-child flows.</summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Optional guardian (parent) to link this user to. For admins creating a child;
    /// ignored for parents (the caller becomes the guardian automatically).
    /// </summary>
    public Guid? GuardianId { get; set; }

    /// <summary>Optional profile fields, set on the user's profile at creation time.</summary>
    public DateTime? DateOfBirth { get; set; }

    [StringLength(20)]
    public string? Gender { get; set; }
}
