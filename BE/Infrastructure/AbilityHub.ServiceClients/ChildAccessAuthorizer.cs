using System.Security.Claims;
using AbilityHub.Shared.Common;

namespace AbilityHub.ServiceClients;

/// <inheritdoc />
public sealed class ChildAccessAuthorizer(IUsersServiceClient usersClient) : IChildAccessAuthorizer
{
    public async Task<bool> CanManageChildAsync(ClaimsPrincipal user, Guid childId)
    {
        if (user.IsInRole(Roles.Admin))
            return true;

        return user.IsInRole(Roles.Parent)
            && await usersClient.IsGuardianOfChildAsync(user.GetUserId(), childId);
    }

    public async Task<bool> CanViewChildAsync(ClaimsPrincipal user, Guid childId)
        => childId == user.GetUserId() || await CanManageChildAsync(user, childId);
}
