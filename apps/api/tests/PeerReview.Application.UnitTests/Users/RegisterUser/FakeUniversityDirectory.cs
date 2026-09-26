using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.UnitTests.Users.RegisterUser;

internal sealed class FakeUniversityDirectory : IUniversityDirectory
{
    private readonly Result<UniversityDirectoryEntry> _result;

    public FakeUniversityDirectory(Result<UniversityDirectoryEntry> result)
    {
        _result = result;
    }

    public int CallCount { get; private set; }

    public string? LastUniversityNameQueried { get; private set; }

    public Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken)
    {
        CallCount++;
        LastUniversityNameQueried = universityName;
        return Task.FromResult(_result);
    }
}
