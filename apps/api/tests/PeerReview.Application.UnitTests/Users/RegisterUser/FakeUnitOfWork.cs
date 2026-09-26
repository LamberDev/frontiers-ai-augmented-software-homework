using PeerReview.Application.Abstractions.Persistence;

namespace PeerReview.Application.UnitTests.Users.RegisterUser;

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public int SaveChangesCallCount { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCallCount++;
        return Task.FromResult(0);
    }
}
