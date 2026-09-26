namespace PeerReview.Api.IntegrationTests;

public class CorsPolicyTests : IClassFixture<PeerReviewApiFactory>
{
    private const string ConfiguredOrigin = "http://localhost:5173";

    private readonly HttpClient _client;

    public CorsPolicyTests(PeerReviewApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Preflight_FromTheConfiguredFrontendOrigin_IsAllowed()
    {
        var response = await SendPreflightAsync(ConfiguredOrigin);

        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values));
        Assert.Contains(ConfiguredOrigin, values!);
    }

    [Fact]
    public async Task Preflight_FromAnUnconfiguredOrigin_IsNotAllowed()
    {
        var response = await SendPreflightAsync("http://not-allowed.example.com");

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private async Task<HttpResponseMessage> SendPreflightAsync(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/users");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

        return await _client.SendAsync(request);
    }
}
