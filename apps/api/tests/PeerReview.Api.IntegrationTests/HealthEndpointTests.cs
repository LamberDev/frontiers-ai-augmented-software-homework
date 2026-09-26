using System.Net;

namespace PeerReview.Api.IntegrationTests;

public class HealthEndpointTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(PeerReviewApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_Returns200()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
