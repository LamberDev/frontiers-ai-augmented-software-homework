namespace PeerReview.Infrastructure.Universities.FrontiersOrganizations;

/// <summary>
/// Response DTO for one entry of the Frontiers organizations elastic-suggestions endpoint.
/// Only the fields the adapter needs are mapped; the rest of the upstream payload is ignored.
/// </summary>
internal sealed record FrontiersOrganizationSuggestion(
    long Id,
    string? OrganizationName,
    string? MatchedName,
    decimal? Score);
