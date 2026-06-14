namespace AbilityHub.Auth.Controllers.DTOs;

public class CreateUserResponse
{
    public bool Success { get; set; }
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}
