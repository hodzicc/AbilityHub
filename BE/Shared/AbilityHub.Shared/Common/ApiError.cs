namespace AbilityHub.Shared.Common;

/// <summary>
/// Standard error body returned by every service so clients (web app, mobile
/// apps) can handle failures uniformly.
/// </summary>
public class ApiError
{
    public string Code { get; init; } = "error";
    public string Message { get; init; } = string.Empty;
    public string? CorrelationId { get; init; }

    public ApiError() { }

    public ApiError(string code, string message, string? correlationId = null)
    {
        Code = code;
        Message = message;
        CorrelationId = correlationId;
    }
}
