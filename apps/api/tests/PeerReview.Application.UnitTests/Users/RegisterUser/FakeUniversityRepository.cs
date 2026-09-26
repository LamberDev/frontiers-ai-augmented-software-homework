using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Universities;

namespace PeerReview.Application.UnitTests.Users.RegisterUser;

internal sealed class FakeUniversityRepository : IUniversityRepository
{
    private readonly List<University> _universities;
    private readonly List<University> _added = [];

    public FakeUniversityRepository(IEnumerable<University>? seed = null)
    {
        _universities = seed is null ? [] : [.. seed];
    }

    public IReadOnlyList<University> Added => _added;

    public Task<University?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(_universities.FirstOrDefault(university => university.Id == id));

    public Task<University?> GetByFrontiersOrganizationIdAsync(long frontiersOrganizationId, CancellationToken cancellationToken) =>
        Task.FromResult(_universities.FirstOrDefault(university => university.FrontiersOrganizationId == frontiersOrganizationId));

    public Task AddAsync(University entity, CancellationToken cancellationToken)
    {
        _universities.Add(entity);
        _added.Add(entity);
        return Task.CompletedTask;
    }
}
