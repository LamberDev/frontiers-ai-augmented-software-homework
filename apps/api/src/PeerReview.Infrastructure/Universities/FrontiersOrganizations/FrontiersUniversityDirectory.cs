using System.Net.Http.Json;
using System.Text.Json;
using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Infrastructure.Universities.FrontiersOrganizations;

/// <summary>
/// <see cref="IUniversityDirectory"/> adapter backed by the Frontiers organizations
/// elastic-suggestions HTTP endpoint. Performs the anti-corruption mapping between the
/// upstream, fuzzy-search response and the domain-facing <see cref="UniversityDirectoryEntry"/>.
/// </summary>
public sealed class FrontiersUniversityDirectory : IUniversityDirectory
{
    private const string SuggestionsRelativePath = "v1/organizations/elasticSuggestions";
    private const int MaxSuggestionCount = 1;

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;

    public FrontiersUniversityDirectory(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken)
    {
        var requestUri = $"{SuggestionsRelativePath}?query={Uri.EscapeDataString(universityName)}&maxcount={MaxSuggestionCount}";

        List<FrontiersOrganizationSuggestion?>? suggestions;

        try
        {
            using var response = await _httpClient.GetAsync(requestUri, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable);
            }

            suggestions = await response.Content
                .ReadFromJsonAsync<List<FrontiersOrganizationSuggestion?>>(SerializerOptions, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // HttpClient surfaces both a caller-triggered cancellation and its own Timeout expiry
            // as an OperationCanceledException/TaskCanceledException. Only a timeout (the caller's
            // token was NOT the one that fired) is an upstream failure; a caller cancellation must
            // propagate unchanged, so it falls through this guard clause.
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable);
        }
        catch (HttpRequestException)
        {
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable);
        }
        catch (JsonException)
        {
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable);
        }

        if (suggestions is null)
        {
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable);
        }

        if (suggestions.Count == 0)
        {
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.NotFound);
        }

        var suggestion = suggestions[0];

        if (suggestion is null || suggestion.Id <= 0 || string.IsNullOrWhiteSpace(suggestion.OrganizationName))
        {
            // Invalid upstream data never falls back to matchedName: a null element, an empty
            // organizationName, or a non-positive id is treated as an invalid directory entry
            // regardless of what matchedName carries.
            return Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.InvalidEntry);
        }

        return Result.Success(new UniversityDirectoryEntry(
            suggestion.Id,
            suggestion.OrganizationName.Trim(),
            suggestion.Score));
    }
}
