namespace AbilityHub.ServiceClients;

/// <summary>
/// Talks to the AppRegistry service for assignment questions other services can't
/// answer locally (the child↔app graph is owned by AppRegistry). Used by Auth at
/// login to gate a child to apps that are actually assigned to them.
/// </summary>
public interface IAppRegistryServiceClient
{
    /// <summary>
    /// The catalog keys of the apps assigned to the child. The call is made on the
    /// child's behalf using <paramref name="accessToken"/> (the AppRegistry endpoint
    /// lets a child read their own assignments). Returns empty on any error.
    /// </summary>
    Task<IReadOnlyList<string>> GetAssignedAppKeysAsync(Guid childId, string accessToken);
}
