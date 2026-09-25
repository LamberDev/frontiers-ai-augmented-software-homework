using Microsoft.EntityFrameworkCore;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Universities;

namespace PeerReview.Infrastructure.Persistence.Repositories;

public sealed class UniversityRepository(PeerReviewDbContext dbContext)
    : Repository<University, Guid>(dbContext), IUniversityRepository
{
    public Task<University?> GetByFrontiersOrganizationIdAsync(long frontiersOrganizationId, CancellationToken cancellationToken) =>
        DbContext.Universities.FirstOrDefaultAsync(
            university => university.FrontiersOrganizationId == frontiersOrganizationId,
            cancellationToken);
}
