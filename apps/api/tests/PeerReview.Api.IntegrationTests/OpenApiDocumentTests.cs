using System.Net;
using System.Text.Json;

namespace PeerReview.Api.IntegrationTests;

public class OpenApiDocumentTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly HttpClient _client;

    public OpenApiDocumentTests(PeerReviewApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetOpenApiDocument_IsServedAndListsBothUseCasePaths()
    {
        var response = await _client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var paths = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty("/api/users", out _));
        Assert.True(paths.TryGetProperty("/api/reviewers/invitations", out _));
    }
}
