using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.Universities;

public interface IUniversityDirectory
{
    Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken);
}
