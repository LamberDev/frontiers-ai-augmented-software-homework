using PeerReview.Domain.Reviewers;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;

namespace PeerReview.Domain.UnitTests.Reviewers;

public class ReviewerEligibilityPolicyTests
{
    private static User CreateUser(int numberOfPublications, decimal? universityScore)
    {
        var university = University.Create(frontiersOrganizationId: 1, name: "MIT", score: universityScore).Value;

        return User.Create(userName: "Ada", numberOfPublications: numberOfPublications, university: university).Value;
    }

    [Fact]
    public void Evaluate_WithExactlyThreePublications_ReturnsInsufficientPublications()
    {
        var user = CreateUser(numberOfPublications: 3, universityScore: 60m);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.False(eligibility.IsEligible);
        var reason = Assert.Single(eligibility.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, reason.Code);
    }

    [Fact]
    public void Evaluate_WithFourPublicationsAndScoreSixty_IsEligibleWithNoReasons()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: 60m);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.True(eligibility.IsEligible);
        Assert.Empty(eligibility.Reasons);
    }

    [Theory]
    [InlineData(59)]
    [InlineData(59.9)]
    public void Evaluate_WithScoreBelowSixty_ReturnsInsufficientUniversityScore(double score)
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: (decimal)score);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.False(eligibility.IsEligible);
        var reason = Assert.Single(eligibility.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, reason.Code);
    }

    [Fact]
    public void Evaluate_WithScoreExactlySixty_IsEligible()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: 60m);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.True(eligibility.IsEligible);
    }

    [Fact]
    public void Evaluate_WithNullScore_ReturnsOnlyUnknownUniversityScore()
    {
        var user = CreateUser(numberOfPublications: 4, universityScore: null);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.False(eligibility.IsEligible);
        var reason = Assert.Single(eligibility.Reasons);
        Assert.Equal(ReviewerIneligibilityReasons.UnknownUniversityScore.Code, reason.Code);
    }

    [Fact]
    public void Evaluate_WithInsufficientPublicationsAndScore_ReturnsBothReasonsInOrder()
    {
        var user = CreateUser(numberOfPublications: 3, universityScore: 59m);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.False(eligibility.IsEligible);
        Assert.Equal(2, eligibility.Reasons.Count);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, eligibility.Reasons[0].Code);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientUniversityScore.Code, eligibility.Reasons[1].Code);
    }

    [Fact]
    public void Evaluate_WithInsufficientPublicationsAndNullScore_ReturnsBothReasonsInOrder()
    {
        var user = CreateUser(numberOfPublications: 3, universityScore: null);

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        Assert.False(eligibility.IsEligible);
        Assert.Equal(2, eligibility.Reasons.Count);
        Assert.Equal(ReviewerIneligibilityReasons.InsufficientPublications.Code, eligibility.Reasons[0].Code);
        Assert.Equal(ReviewerIneligibilityReasons.UnknownUniversityScore.Code, eligibility.Reasons[1].Code);
    }

    [Fact]
    public void Evaluate_WithNullUser_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => ReviewerEligibilityPolicy.Evaluate(null!));
    }
}
