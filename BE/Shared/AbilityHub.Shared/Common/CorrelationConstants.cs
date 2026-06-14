namespace AbilityHub.Shared.Common;

public static class CorrelationConstants
{
    /// <summary>
    /// Header carrying a request's correlation id end-to-end. The gateway sets
    /// it on ingress (generating one if absent) and YARP forwards it downstream,
    /// so every service can log against the same id.
    /// </summary>
    public const string HeaderName = "X-Correlation-ID";
}
