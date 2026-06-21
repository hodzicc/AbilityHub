using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Auth.Entities;

/// <summary>
/// A short-lived, single-use token a guardian issues so a child can sign in to a
/// mobile app by scanning a QR code instead of typing credentials. The QR encodes
/// <c>{ childId, token }</c>; the app exchanges the token for a normal session
/// (see <c>POST /api/auth/pairing/exchange</c>). Only the SHA-256 hash of the token
/// is stored, so a database leak does not expose usable pairing codes.
/// </summary>
[Table("PairingTokens")]
public class PairingToken
{
    public Guid Id { get; set; }

    /// <summary>The child credential this token authenticates as.</summary>
    public Guid ChildId { get; set; }

    /// <summary>SHA-256 hash of the opaque token handed to the client.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    /// <summary>Set once the token has been redeemed; a token is valid at most once.</summary>
    public bool IsUsed { get; set; }

    public DateTime CreatedAt { get; set; }
}
