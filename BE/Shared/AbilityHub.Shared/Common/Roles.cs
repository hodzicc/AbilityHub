namespace AbilityHub.Shared.Common;

/// <summary>
/// Canonical platform roles. Ids match the seed order in the Auth service
/// (see RoleSeedData). Names are used in JWT role claims / [Authorize(Roles=...)].
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Parent = "Parent";
    public const string Child = "Child";

    public const int AdminId = 1;
    public const int ParentId = 2;
    public const int ChildId = 3;

    public static bool IsValidId(int roleId) => roleId is AdminId or ParentId or ChildId;
}
