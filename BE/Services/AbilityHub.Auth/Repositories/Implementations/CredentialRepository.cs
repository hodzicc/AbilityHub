using Microsoft.EntityFrameworkCore;
using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Repositories.Interfaces;

namespace AbilityHub.Auth.Repositories.Implementations
{
    public class CredentialRepository(AuthDbContext context) : ICredentialRepository
    {
        private readonly AuthDbContext _context = context;

        public async Task<Credential?> GetByIdAsync(Guid id)
            => await _context.Credentials
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<Credential?> GetByEmailAsync(string email)
            => await _context.Credentials
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Email == email);

        public async Task<bool> ExistsByEmailAsync(string email)
            => await _context.Credentials.AnyAsync(c => c.Email == email);

        public async Task AddAsync(Credential credential)
        {
            await _context.Credentials.AddAsync(credential);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Credential credential)
        {
            _context.Credentials.Update(credential);
            await _context.SaveChangesAsync();
        }
    }
}
