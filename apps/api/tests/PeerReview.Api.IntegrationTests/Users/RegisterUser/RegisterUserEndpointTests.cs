using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PeerReview.Application.Universities;

namespace PeerReview.Api.IntegrationTests.Users.RegisterUser;

public class RegisterUserEndpointTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly PeerReviewApiFactory _factory;
    private readonly HttpClient _client;

    public RegisterUserEndpointTests(PeerReviewApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostUsers_WithValidRequest_Returns201WithCamelCaseBodyShape()
    {
        _factory.UniversityDirectory.AddEntry(
            "Harvard University",
            new UniversityDirectoryEntry(1327079645, "Harvard University", 94.36m));
        var payload = new { userName = "Ada Lovelace", universityName = "Harvard University", numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.NotEqual(Guid.Empty, root.GetProperty("userId").GetGuid());
        Assert.Equal("Ada Lovelace", root.GetProperty("userName").GetString());
        Assert.Equal(5, root.GetProperty("numberOfPublications").GetInt32());
        var university = root.GetProperty("university");
        Assert.NotEqual(Guid.Empty, university.GetProperty("id").GetGuid());
        Assert.Equal(1327079645, university.GetProperty("frontiersOrganizationId").GetInt64());
        Assert.Equal("Harvard University", university.GetProperty("name").GetString());
        Assert.Equal(94.36m, university.GetProperty("score").GetDecimal());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task PostUsers_WithBlankUserName_ReturnsValidationProblemForUserNameField(string userName)
    {
        _factory.UniversityDirectory.AddEntry("MIT", new UniversityDirectoryEntry(1, "MIT", 80m));
        var payload = new { userName, universityName = "MIT", numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("userName", out _));
    }

    [Fact]
    public async Task PostUsers_WithNegativeNumberOfPublications_ReturnsValidationProblemForNumberOfPublicationsField()
    {
        _factory.UniversityDirectory.AddEntry("MIT", new UniversityDirectoryEntry(1, "MIT", 80m));
        var payload = new { userName = "Ada Lovelace", universityName = "MIT", numberOfPublications = -1 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("numberOfPublications", out _));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task PostUsers_WithBlankUniversityName_ReturnsValidationProblemForUniversityNameField(string universityName)
    {
        var payload = new { userName = "Ada Lovelace", universityName, numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("universityName", out _));
    }

    [Fact]
    public async Task PostUsers_WhenUniversityNotFoundInFrontiers_Returns404ProblemDetailsWithCode()
    {
        var payload = new { userName = "Grace Hopper", universityName = "Not A Real University", numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(UniversityDirectoryErrors.NotFound.Code, root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task PostUsers_WhenFrontiersDirectoryUnavailable_Returns502ProblemDetailsWithCode()
    {
        _factory.UniversityDirectory.FailNextLookupWith(UniversityDirectoryErrors.Unavailable);
        var payload = new { userName = "Grace Hopper", universityName = "MIT", numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(UniversityDirectoryErrors.Unavailable.Code, root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task PostUsers_WhenFrontiersReturnsInvalidEntry_Returns502ProblemDetailsWithCode()
    {
        _factory.UniversityDirectory.FailNextLookupWith(UniversityDirectoryErrors.InvalidEntry);
        var payload = new { userName = "Grace Hopper", universityName = "MIT", numberOfPublications = 5 };

        var response = await _client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(UniversityDirectoryErrors.InvalidEntry.Code, root.GetProperty("code").GetString());
    }
}
