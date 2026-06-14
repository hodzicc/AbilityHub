using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Auth.Entities;
    
[Table("RefreshTokens")]
public class RefreshToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = null!;
    public Guid UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}
