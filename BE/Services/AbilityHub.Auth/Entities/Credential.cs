using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Auth.Entities;

/// <summary>
/// The authentication record owned by the Auth service. This is the single
/// identity a user authenticates with across every mobile/web application
/// (centralized SSO). Profile data (name, settings, apps) lives in other
/// services keyed by the same <see cref="Id"/>.
/// </summary>
[Table("Credentials")]
public class Credential
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Deactivated accounts cannot log in (admin can disable a user).</summary>
    public bool IsActive { get; set; } = true;

    [ForeignKey("RoleId")]
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
