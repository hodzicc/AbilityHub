using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Users.Controllers.DTOs;

public class UpdateProfileRequest
{
    [Required, StringLength(100)]
    public required string FirstName { get; set; }

    [Required, StringLength(100)]
    public required string LastName { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [StringLength(20)]
    public string? Gender { get; set; }
}
