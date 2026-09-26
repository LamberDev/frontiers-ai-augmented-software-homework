namespace PeerReview.Api.IntegrationTests.Startup;

/// <summary>
/// Runs host-startup tests alone, after the parallel collections, so no other test starts a host
/// at the same time.
/// </summary>
[CollectionDefinition(nameof(HostStartupCollection), DisableParallelization = true)]
public class HostStartupCollection;
