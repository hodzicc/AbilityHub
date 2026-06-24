namespace AbilityHub.Auth.Controllers.DTOs
{
    public class AuthRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }

        /// <summary>
        /// Optional stable key (slug) of the app the login comes from, e.g. "reference-mobile".
        /// When a <b>child</b> supplies it, the login is allowed only if that app is assigned
        /// to them. Ignored for parents/admins, and skipped when omitted.
        /// </summary>
        public string? AppKey { get; set; }
    }
}
