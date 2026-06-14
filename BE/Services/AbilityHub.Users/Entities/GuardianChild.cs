using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Users.Entities;

/// <summary>
/// Links a guardian (parent) to a child. Many-to-many: a child can have several
/// guardians and a guardian several children. This relationship is the backbone
/// of the platform — parents manage the apps, settings and limits of their
/// linked children.
/// </summary>
[Table("GuardianChildren")]
public class GuardianChild
{
    public Guid GuardianId { get; set; }
    public Guid ChildId { get; set; }
    public DateTime LinkedAt { get; set; }

    [ForeignKey(nameof(GuardianId))]
    public User? Guardian { get; set; }

    [ForeignKey(nameof(ChildId))]
    public User? Child { get; set; }
}
