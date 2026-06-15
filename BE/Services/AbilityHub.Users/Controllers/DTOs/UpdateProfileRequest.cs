namespace AbilityHub.Users.Controllers.DTOs;

public class UpdateProfileRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}
