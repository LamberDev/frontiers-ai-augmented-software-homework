using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Users;

namespace PeerReview.Application.UnitTests.Users.RegisterUser;

internal sealed class FakeUserRepository : IUserRepository
{
    private readonly List<User> _added = [];

    public IReadOnlyList<User> Added => _added;

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(_added.FirstOrDefault(user => user.Id == id));

    public Task AddAsync(User entity, CancellationToken cancellationToken)
    {
        _added.Add(entity);
        return Task.CompletedTask;
    }
}
