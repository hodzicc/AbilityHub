using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.AppRegistry.Entities;

/// <summary>
/// An application assigned to a child (the apps a child actually uses).
/// <see cref="ChildId"/> references a user owned by other services, so there is
/// no database FK for it — only the application FK is local.
/// </summary>
[Table("ChildApplications")]
public class ChildApplication
{
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid AssignedByGuardianId { get; set; }
    public DateTime AssignedAt { get; set; }

    [ForeignKey(nameof(ApplicationId))]
    public Application? Application { get; set; }
}
