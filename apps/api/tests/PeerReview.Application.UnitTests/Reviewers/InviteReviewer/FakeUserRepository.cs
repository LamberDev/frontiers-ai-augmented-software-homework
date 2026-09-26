using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Users;

namespace PeerReview.Application.UnitTests.Reviewers.InviteReviewer;

internal sealed class FakeUserRepository : IUserRepository
{
    private readonly List<User> _users;

    public FakeUserRepository(IEnumerable<User>? seed = null)
    {
        _users = seed is null ? [] : [.. seed];
    }

    public int CallCount { get; private set; }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        CallCount++;
        return Task.FromResult(_users.FirstOrDefault(user => user.Id == id));
    }

    public Task AddAsync(User entity, CancellationToken cancellationToken)
    {
        _users.Add(entity);
        return Task.CompletedTask;
    }
}
