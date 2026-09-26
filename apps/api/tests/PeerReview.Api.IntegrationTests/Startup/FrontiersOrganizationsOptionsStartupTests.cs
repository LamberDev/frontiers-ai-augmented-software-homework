using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Options;

namespace PeerReview.Api.IntegrationTests.Startup;

/// <summary>
/// Proves that an invalid "FrontiersOrganizations" configuration fails the whole host at startup,
/// via <c>ValidateOnStart()</c> (registered in <c>AddInfrastructure()</c>), instead of only
/// surfacing later on the first request that resolves
/// <see cref="IOptions{TOptions}"/>&lt;FrontiersOrganizationsOptions&gt;. Uses its own bare
/// <see cref="WebApplicationFactory{TEntryPoint}"/> (not the shared <see cref="PeerReviewApiFactory"/>)
/// because the point under test is the composition root's own validation, not any test-only
/// service swap.
/// </summary>
public class FrontiersOrganizationsOptionsStartupTests
{
    [Fact]
    public void CreatingTheClient_WithInvalidFrontiersOrganizationsBaseAddress_ThrowsOptionsValidationExceptionAtStartup()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("FrontiersOrganizations:BaseAddress", "not-a-uri"));

        // WebApplicationFactory starts the host the first time a client/server is requested, so
        // a startup failure surfaces here rather than from any HTTP call made with the client.
        var thrown = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        var validationException = FindOptionsValidationException(thrown);

        Assert.NotNull(validationException);
        Assert.Contains(
            "FrontiersOrganizations:BaseAddress must be an absolute http or https URI.",
            validationException!.Failures);
    }

    // WebApplicationFactory/generic-host startup failures can surface as the exact exception the
    // failing hosted service threw, or wrapped in an outer exception (e.g. from the test host or
    // Task unwrapping); walk the InnerException chain so the assertion targets the real cause
    // either way.
    private static OptionsValidationException? FindOptionsValidationException(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is OptionsValidationException validationException)
            {
                return validationException;
            }
        }

        return null;
    }
}
