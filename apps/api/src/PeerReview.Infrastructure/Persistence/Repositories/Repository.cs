using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Infrastructure.Persistence.Repositories;

public abstract class Repository<TEntity, TId>(PeerReviewDbContext dbContext) : IRepository<TEntity, TId>
    where TEntity : Entity<TId>
    where TId : notnull
{
    protected PeerReviewDbContext DbContext { get; } = dbContext;

    public virtual async Task<TEntity?> GetByIdAsync(TId id, CancellationToken cancellationToken) =>
        await DbContext.Set<TEntity>().FindAsync([id], cancellationToken);

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken) =>
        await DbContext.Set<TEntity>().AddAsync(entity, cancellationToken);
}
