using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Auth.Controllers.DTOs
{
    public class AuthRequest
    {
        [Required, EmailAddress, StringLength(256)]
        public required string Email { get; set; }

        // Only non-empty is enforced at login; the account's real policy was applied at creation.
        [Required, StringLength(128, MinimumLength = 1)]
        public required string Password { get; set; }

        /// <summary>
        /// Optional stable key (slug) of the app the login comes from, e.g. "reference-mobile".
        /// When a <b>child</b> supplies it, the login is allowed only if that app is assigned
        /// to them. Ignored for parents/admins, and skipped when omitted.
        /// </summary>
        [StringLength(100)]
        public string? AppKey { get; set; }
    }
}
