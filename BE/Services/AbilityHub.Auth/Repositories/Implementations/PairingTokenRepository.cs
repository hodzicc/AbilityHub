using Microsoft.EntityFrameworkCore;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;

namespace AbilityHub.Auth.Repositories.Implementations
{
    public class PairingTokenRepository(AuthDbContext context) : IPairingTokenRepository
    {
        private readonly AuthDbContext _context = context;

        public async Task AddAsync(PairingToken token)
        {
            await _context.PairingTokens.AddAsync(token);
            await _context.SaveChangesAsync();
        }

        public async Task<PairingToken?> GetByHashAsync(string tokenHash)
            => await _context.PairingTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        public async Task UpdateAsync(PairingToken token)
        {
            _context.PairingTokens.Update(token);
            await _context.SaveChangesAsync();
        }
    }
}
