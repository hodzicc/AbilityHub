using System.Security.Cryptography;

namespace AbilityHub.Auth.Security;

/// <summary>
/// Salted, slow password hashing using PBKDF2-HMAC-SHA256. Each hash embeds its
/// own random salt and iteration count, so the work factor can be raised over
/// time without invalidating older hashes. Replaces the previous unsalted,
/// single-round SHA-256 hashing, which was fast to brute-force and vulnerable
/// to rainbow tables.
/// </summary>
public class Pbkdf2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;       // 128-bit salt
    private const int KeySize = 32;        // 256-bit derived key
    private const int Iterations = 210_000; // OWASP 2023 guidance for PBKDF2-SHA256
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    // Stored format: v1.{iterations}.{salt}.{hash}
    private const string Prefix = "v1";

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return string.Join('.',
            Prefix,
            Iterations,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(key));
    }

    public bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split('.', 4);
        if (parts.Length != 4 || parts[0] != Prefix)
            return false;

        if (!int.TryParse(parts[1], out var iterations))
            return false;

        var salt = Convert.FromBase64String(parts[2]);
        var expectedKey = Convert.FromBase64String(parts[3]);

        var actualKey = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, Algorithm, expectedKey.Length);

        return CryptographicOperations.FixedTimeEquals(actualKey, expectedKey);
    }
}
