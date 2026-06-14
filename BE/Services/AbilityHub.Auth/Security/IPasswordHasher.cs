namespace AbilityHub.Auth.Security;

public interface IPasswordHasher
{
    /// <summary>Produces a salted, self-describing hash safe to store at rest.</summary>
    string Hash(string password);

    /// <summary>Constant-time verification of a password against a stored hash.</summary>
    bool Verify(string password, string storedHash);
}
