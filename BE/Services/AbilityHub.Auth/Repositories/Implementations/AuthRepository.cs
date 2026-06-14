using Microsoft.EntityFrameworkCore;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;

namespace AbilityHub.Auth.Repositories.Implementations
{
    public class AuthRepository(AuthDbContext context) : IAuthRepository
    {
        private readonly AuthDbContext _context = context;

        public async Task<RefreshToken?> GetByTokenAsync(string token)
            => await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);

        public async Task AddAsync(RefreshToken token)
        {
            await _context.RefreshTokens.AddAsync(token);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(RefreshToken token)
        {
            _context.RefreshTokens.Update(token);
            await _context.SaveChangesAsync();
        }

        public async Task RevokeAllForUserAsync(Guid userId)
        {
            await _context.RefreshTokens
                .Where(t => t.UserId == userId && !t.IsRevoked)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true));
        }
    }
}
