namespace AbilityHub.Auth.Controllers.DTOs;

public class CreateUserRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }

    /// <summary>Role to assign: 1 = Admin, 2 = Parent, 3 = Child (see RoleSeedData).</summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Optional guardian (parent) to link this user to. For admins creating a child;
    /// ignored for parents (the caller becomes the guardian automatically).
    /// </summary>
    public Guid? GuardianId { get; set; }
}
