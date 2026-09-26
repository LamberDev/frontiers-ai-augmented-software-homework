using System.Net;
using System.Text.Json;

namespace PeerReview.Api.IntegrationTests.SharedKernel.Http;

public class StatusCodePagesTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly HttpClient _client;

    public StatusCodePagesTests(PeerReviewApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UnknownRoute_Returns404ProblemDetailsWithRouteNotFoundCode()
    {
        var response = await _client.GetAsync("/api/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Route.NotFound", root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task WrongMethod_Returns405ProblemDetailsWithMethodNotAllowedCode()
    {
        var response = await _client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Request.MethodNotAllowed", root.GetProperty("code").GetString());
    }
}
