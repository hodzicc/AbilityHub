using System.Security.Claims;

namespace AbilityHub.Shared.Common;

public static class ClaimsPrincipalExtensions
{
    /// <summary>The authenticated user's id from the NameIdentifier claim.</summary>
    public static Guid GetUserId(this ClaimsPrincipal user)
        => Guid.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");
}
