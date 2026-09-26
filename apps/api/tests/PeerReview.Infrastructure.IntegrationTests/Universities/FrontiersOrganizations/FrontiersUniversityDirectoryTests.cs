using System.Net;
using System.Text;
using PeerReview.Application.Universities;
using PeerReview.Infrastructure.Universities.FrontiersOrganizations;

namespace PeerReview.Infrastructure.IntegrationTests.Universities.FrontiersOrganizations;

public class FrontiersUniversityDirectoryTests
{
    private const string BaseAddress = "https://organizations-api.frontiersin.org/";

    private static (FrontiersUniversityDirectory Directory, FakeHttpMessageHandler Handler) CreateSut(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
    {
        var fakeHandler = new FakeHttpMessageHandler(handler);
        var httpClient = new HttpClient(fakeHandler) { BaseAddress = new Uri(BaseAddress) };

        return (new FrontiersUniversityDirectory(httpClient), fakeHandler);
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode statusCode, string json) =>
        new(statusCode) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    [Fact]
    public async Task FindByNameAsync_WithSuccessfulResponse_ReturnsMappedEntryWithTrimmedNameAndScore()
    {
        const string json = """[{"id":1327079645,"organizationName":"  Harvard University  ","matchedName":null,"score":94.3555}]""";
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, json)));

        var result = await sut.FindByNameAsync("Harvard University", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(1327079645, result.Value.FrontiersOrganizationId);
        Assert.Equal("Harvard University", result.Value.Name);
        Assert.Equal(94.3555m, result.Value.Score);
    }

    [Fact]
    public async Task FindByNameAsync_WithSuccessfulResponseAndNullScore_ReturnsEntryWithNullScore()
    {
        const string json = """[{"id":42,"organizationName":"MIT","matchedName":null,"score":null}]""";
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, json)));

        var result = await sut.FindByNameAsync("MIT", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value.FrontiersOrganizationId);
        Assert.Null(result.Value.Score);
    }

    [Fact]
    public async Task FindByNameAsync_BuildsRequestWithEncodedQueryAndMaxCountOne()
    {
        const string json = "[]";
        var (sut, handler) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, json)));

        await sut.FindByNameAsync("Universidad de Alcalá & Co", CancellationToken.None);

        Assert.NotNull(handler.LastRequest);
        var requestUri = handler.LastRequest!.RequestUri!;
        Assert.Equal("/v1/organizations/elasticSuggestions", requestUri.AbsolutePath);

        var queryParameters = requestUri.Query
            .TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair => pair.Split('=', 2))
            .ToDictionary(parts => parts[0], parts => Uri.UnescapeDataString(parts[1]));

        Assert.Equal("Universidad de Alcalá & Co", queryParameters["query"]);
        Assert.Equal("1", queryParameters["maxcount"]);
    }

    [Fact]
    public async Task FindByNameAsync_WithEmptyArrayResponse_ReturnsNotFound()
    {
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, "[]")));

        var result = await sut.FindByNameAsync("zzqqxxnotauniversity", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.NotFound, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WithBlankOrganizationNameAndNonEmptyMatchedName_ReturnsInvalidEntryWithoutFallingBackToMatchedName()
    {
        const string json = """[{"id":1,"organizationName":"   ","matchedName":"Some Matched Name","score":10.0}]""";
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, json)));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.InvalidEntry, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WithNonPositiveId_ReturnsInvalidEntry()
    {
        const string json = """[{"id":0,"organizationName":"Some University","matchedName":null,"score":10.0}]""";
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, json)));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.InvalidEntry, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WithNonSuccessStatusCode_ReturnsUnavailable()
    {
        var (sut, _) = CreateSut((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WhenHttpRequestExceptionIsThrown_ReturnsUnavailable()
    {
        var (sut, _) = CreateSut((_, _) => throw new HttpRequestException("boom"));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WithMalformedJsonResponse_ReturnsUnavailable()
    {
        var (sut, _) = CreateSut((_, _) => Task.FromResult(JsonResponse(HttpStatusCode.OK, "not-json{")));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WhenHandlerTimesOutWithoutCallerCancellation_ReturnsUnavailable()
    {
        // Simulates an HttpClient.Timeout expiry: the handler throws a TaskCanceledException tied
        // to a token that is NOT the caller's token, which must be converted to Unavailable rather
        // than propagated.
        var (sut, _) = CreateSut((_, _) => throw new TaskCanceledException("simulated timeout"));

        var result = await sut.FindByNameAsync("anything", CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
    }

    [Fact]
    public async Task FindByNameAsync_WhenCallerCancelsToken_PropagatesOperationCanceledException()
    {
        using var cts = new CancellationTokenSource();
        var (sut, _) = CreateSut((_, token) =>
        {
            token.ThrowIfCancellationRequested();
            return Task.FromResult(JsonResponse(HttpStatusCode.OK, "[]"));
        });

        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => sut.FindByNameAsync("anything", cts.Token));
    }
}
