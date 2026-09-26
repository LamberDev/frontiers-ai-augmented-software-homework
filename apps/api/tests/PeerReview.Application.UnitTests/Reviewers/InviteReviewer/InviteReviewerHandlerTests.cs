using PeerReview.Application.Reviewers.InviteReviewer;
using PeerReview.Domain.Reviewers;
using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;

namespace PeerReview.Application.UnitTests.Reviewers.InviteReviewer;

public class InviteReviewerHandlerTests
{
    private static User CreateUser(int numberOfPublications, decimal? universityScore)
    {
        var university = University.Create(1, "Test University", universityScore).Value;
        return User.Create("Ada Lovelace", numberOfPublications, university).Value;
    }

    [Fact]
    public async Task HandleAsync_WithEligibleUser_ReturnsInvitedWithNoReasons()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: 60m);
        var repository = new FakeUserRepository([user]);
        var handler = new InviteReviewerHandler(repository);
        var command = new InviteReviewerCommand(user.Id);

        var result = await handler.HandleAsync(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(user.Id, result.Value.UserId);
        Assert.True(result.Value.Invited);
        Assert.Equal("The invitation to review was sent successfully.", result.Value.Message);
        Assert.Empty(result.Value.Reasons);
    }

    [Fact]
    public async Task HandleAsync_WithExactlyThreePublications_ReturnsNotInvitedWithInsufficientPublicationsReason()
    {
        var user = CreateUser(numberOfPublications: 3, universityScore: 60m);
        var repository = new FakeUserRepository([user]);
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(user.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Invited);
        Assert.Equal("The user cannot be invited to review.", result.Value.Message);
        var reason = Assert.Single(result.Value.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, reason.Code);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Message, reason.Message);
    }

    [Fact]
    public async Task HandleAsync_WithScoreBelowMinimum_ReturnsNotInvitedWithInsufficientScoreReason()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: 59.99m);
        var repository = new FakeUserRepository([user]);
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(user.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Invited);
        var reason = Assert.Single(result.Value.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, reason.Code);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Message, reason.Message);
    }

    [Fact]
    public async Task HandleAsync_WithNullUniversityScore_ReturnsNotInvitedWithUnknownScoreReason()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: null);
        var repository = new FakeUserRepository([user]);
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(user.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Invited);
        var reason = Assert.Single(result.Value.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.UnknownUniversityScore.Code, reason.Code);
        Assert.Equal(ReviewerIneligibilityReasons.UnknownUniversityScore.Message, reason.Message);
    }

    [Fact]
    public async Task HandleAsync_WithInsufficientPublicationsAndScore_ReturnsBothReasonsInOrder()
    {
        var user = CreateUser(numberOfPublications: 2, universityScore: 10m);
        var repository = new FakeUserRepository([user]);
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(user.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Invited);
        Assert.Equal(2, result.Value.Reasons.Count);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, result.Value.Reasons[0].Code);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, result.Value.Reasons[1].Code);
    }

    [Fact]
    public async Task HandleAsync_WithUnknownUser_ReturnsNotFound()
    {
        var repository = new FakeUserRepository();
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(InviteReviewerErrors.UserNotFound, result.Error);
        Assert.Equal(1, repository.CallCount);
    }

    [Fact]
    public async Task HandleAsync_WithEmptyUserId_ReturnsValidationErrorWithoutCallingRepository()
    {
        var repository = new FakeUserRepository();
        var handler = new InviteReviewerHandler(repository);

        var result = await handler.HandleAsync(new InviteReviewerCommand(Guid.Empty), CancellationToken.None);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == InviteReviewerErrors.UserIdRequired.Code);
        Assert.Equal(0, repository.CallCount);
    }
}
