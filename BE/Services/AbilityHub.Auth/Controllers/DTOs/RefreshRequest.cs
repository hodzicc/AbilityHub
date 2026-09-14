using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Auth.Controllers.DTOs
{
    public class RefreshRequest
    {
        [Required, StringLength(512, MinimumLength = 1)]
        public required string RefreshToken { get; set; }
    }
}
