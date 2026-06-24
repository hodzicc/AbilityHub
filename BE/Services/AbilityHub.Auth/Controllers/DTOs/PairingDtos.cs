namespace AbilityHub.Auth.Controllers.DTOs;

/// <summary>
/// A freshly issued QR pairing token. The web app encodes <c>{ childId, token }</c>
/// into the QR code; the mobile app posts <paramref name="Token"/> back to
/// <c>/api/auth/pairing/exchange</c> to obtain a session.
/// </summary>
public class PairingTokenResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

/// <summary>Sent by the mobile app after scanning the QR code.</summary>
public class PairingExchangeRequest
{
    public required string Token { get; set; }

    /// <summary>
    /// Optional stable key (slug) of the app redeeming the token. When supplied, a child
    /// is let in only if that app is assigned to them. Skipped when omitted.
    /// </summary>
    public string? AppKey { get; set; }
}
