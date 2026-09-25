using Microsoft.EntityFrameworkCore;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Users;

namespace PeerReview.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(PeerReviewDbContext dbContext)
    : Repository<User, Guid>(dbContext), IUserRepository
{
    public override async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await DbContext.Users
            .Include(user => user.University)
            .FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
}
