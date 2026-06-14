using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Auth.Entities;

[Table("Roles")]
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Credential> Credentials { get; set; } = new HashSet<Credential>();
}