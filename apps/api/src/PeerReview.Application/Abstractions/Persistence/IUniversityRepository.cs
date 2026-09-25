using PeerReview.Domain.Universities;

namespace PeerReview.Application.Abstractions.Persistence;

public interface IUniversityRepository : IRepository<University, Guid>
{
    Task<University?> GetByFrontiersOrganizationIdAsync(long frontiersOrganizationId, CancellationToken cancellationToken);
}
