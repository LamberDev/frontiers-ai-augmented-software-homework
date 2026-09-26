using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// Hand-written fake for <see cref="IUniversityDirectory"/> that lets each test control the
/// Frontiers lookup outcome without calling the real, external Frontiers API.
/// </summary>
public sealed class FakeUniversityDirectory : IUniversityDirectory
{
    private readonly Dictionary<string, UniversityDirectoryEntry> _entriesByName = new(StringComparer.OrdinalIgnoreCase);

    private Error? _nextFailure;

    public void AddEntry(string universityName, UniversityDirectoryEntry entry) => _entriesByName[universityName] = entry;

    public void FailNextLookupWith(Error error) => _nextFailure = error;

    public Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken)
    {
        if (_nextFailure is not null)
        {
            var failure = _nextFailure;
            _nextFailure = null;
            return Task.FromResult(Result.Failure<UniversityDirectoryEntry>(failure));
        }

        return Task.FromResult(_entriesByName.TryGetValue(universityName, out var entry)
            ? Result.Success(entry)
            : Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.NotFound));
    }
}
