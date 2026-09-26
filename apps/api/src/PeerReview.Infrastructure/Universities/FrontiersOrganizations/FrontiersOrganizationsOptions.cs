namespace PeerReview.Infrastructure.Universities.FrontiersOrganizations;

/// <summary>
/// Configuration for the Frontiers organizations directory HTTP client, bound from the
/// "FrontiersOrganizations" configuration section.
/// </summary>
public sealed class FrontiersOrganizationsOptions
{
    public const string SectionName = "FrontiersOrganizations";

    public string BaseAddress { get; set; } = "https://organizations-api.frontiersin.org/";

    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(10);
}
