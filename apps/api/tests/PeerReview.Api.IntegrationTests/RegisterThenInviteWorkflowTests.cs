using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PeerReview.Application.Universities;
using PeerReview.Domain.Reviewers;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// Exercises both use cases together end to end: a registered user's id, returned by
/// <c>POST /api/users</c>, is the id later sent to <c>POST /api/reviewers/invitations</c>. This
/// spans both business capabilities, so it does not mirror a single capability folder.
/// </summary>
public class RegisterThenInviteWorkflowTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly PeerReviewApiFactory _factory;
    private readonly HttpClient _client;

    public RegisterThenInviteWorkflowTests(PeerReviewApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterThenInvite_WithEligibleUser_ReturnsInvitedTrue()
    {
        _factory.UniversityDirectory.AddEntry(
            "Harvard University",
            new UniversityDirectoryEntry(1327079645, "Harvard University", 94.36m));

        var registerResponse = await _client.PostAsJsonAsync("/api/users", new
        {
            userName = "Ada Lovelace",
            universityName = "Harvard University",
            numberOfPublications = 10,
        });

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);
        var userId = JsonDocument.Parse(await registerResponse.Content.ReadAsStringAsync())
            .RootElement.GetProperty("userId").GetGuid();

        var inviteResponse = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId });

        Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);
        var root = JsonDocument.Parse(await inviteResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(userId, root.GetProperty("userId").GetGuid());
        Assert.True(root.GetProperty("invited").GetBoolean());
        Assert.Empty(root.GetProperty("reasons").EnumerateArray());
    }

    [Fact]
    public async Task RegisterThenInvite_WithIneligibleUser_ReturnsInvitedFalseWithReasons()
    {
        _factory.UniversityDirectory.AddEntry(
            "Low Score University",
            new UniversityDirectoryEntry(2, "Low Score University", 10m));

        var registerResponse = await _client.PostAsJsonAsync("/api/users", new
        {
            userName = "New Researcher",
            universityName = "Low Score University",
            numberOfPublications = 1,
        });

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);
        var userId = JsonDocument.Parse(await registerResponse.Content.ReadAsStringAsync())
            .RootElement.GetProperty("userId").GetGuid();

        var inviteResponse = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId });

        Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);
        var root = JsonDocument.Parse(await inviteResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.False(root.GetProperty("invited").GetBoolean());
        var reasons = root.GetProperty("reasons").EnumerateArray().ToList();
        Assert.Equal(2, reasons.Count);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, reasons[0].GetProperty("code").GetString());
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, reasons[1].GetProperty("code").GetString());
    }
}
