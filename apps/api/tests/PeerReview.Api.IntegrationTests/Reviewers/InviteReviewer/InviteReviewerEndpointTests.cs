using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Reviewers;
using PeerReview.Domain.Universities;
using DomainUser = PeerReview.Domain.Users.User;

namespace PeerReview.Api.IntegrationTests.Reviewers.InviteReviewer;

public class InviteReviewerEndpointTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly PeerReviewApiFactory _factory;
    private readonly HttpClient _client;

    public InviteReviewerEndpointTests(PeerReviewApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostInvitations_WithEligibleUser_Returns200WithInvitedTrue()
    {
        var userId = await SeedUserAsync(numberOfPublications: 10, universityScore: 90m);

        var response = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(userId, root.GetProperty("userId").GetGuid());
        Assert.True(root.GetProperty("invited").GetBoolean());
        Assert.Empty(root.GetProperty("reasons").EnumerateArray());
    }

    [Fact]
    public async Task PostInvitations_WithIneligibleUser_Returns200WithInvitedFalseAndReasonsInOrder()
    {
        var userId = await SeedUserAsync(numberOfPublications: 1, universityScore: 10m);

        var response = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var root = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(root.GetProperty("invited").GetBoolean());
        var reasons = root.GetProperty("reasons").EnumerateArray().ToList();
        Assert.Equal(2, reasons.Count);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, reasons[0].GetProperty("code").GetString());
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, reasons[1].GetProperty("code").GetString());
    }

    [Fact]
    public async Task PostInvitations_WithUnknownUserId_Returns404()
    {
        var response = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostInvitations_WithEmptyGuid_ReturnsValidationProblemForUserIdField()
    {
        var response = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId = Guid.Empty });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("userId", out _));
    }

    [Fact]
    public async Task PostInvitations_WithNonGuidUserId_ReturnsValidationProblemForUserIdField()
    {
        var response = await _client.PostAsJsonAsync("/api/reviewers/invitations", new { userId = "not-a-guid" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("userId", out _));
    }

    [Fact]
    public async Task PostInvitations_WithMalformedBody_ReturnsValidationProblemForUserIdField()
    {
        var content = new StringContent("{ this is not valid json", Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/reviewers/invitations", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("userId", out _));
    }

    private async Task<Guid> SeedUserAsync(int numberOfPublications, decimal? universityScore)
    {
        using var scope = _factory.Services.CreateScope();
        var universityRepository = scope.ServiceProvider.GetRequiredService<IUniversityRepository>();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var university = University.Create(
            Random.Shared.Next(1, int.MaxValue),
            $"Seed University {Guid.NewGuid()}",
            universityScore).Value;
        await universityRepository.AddAsync(university, CancellationToken.None);

        var user = DomainUser.Create("Seed User", numberOfPublications, university).Value;
        await userRepository.AddAsync(user, CancellationToken.None);

        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        return user.Id;
    }
}
