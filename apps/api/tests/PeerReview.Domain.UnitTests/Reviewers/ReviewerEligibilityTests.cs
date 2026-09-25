using PeerReview.Domain.Reviewers;

namespace PeerReview.Domain.UnitTests.Reviewers;

public class ReviewerEligibilityTests
{
    [Fact]
    public void Eligible_ReturnsEligibleWithNoReasons()
    {
        var eligibility = ReviewerEligibility.Eligible();

        Assert.True(eligibility.IsEligible);
        Assert.Empty(eligibility.Reasons);
    }

    [Fact]
    public void Ineligible_WithReasons_ReturnsIneligibleWithGivenReasons()
    {
        var reasons = new[] { ReviewerIneligibilityReasons.InsufficientPublications };

        var eligibility = ReviewerEligibility.Ineligible(reasons);

        Assert.False(eligibility.IsEligible);
        Assert.Equal(reasons, eligibility.Reasons);
    }

    [Fact]
    public void Ineligible_WithNullReasons_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => ReviewerEligibility.Ineligible(null!));
    }

    [Fact]
    public void Ineligible_WithEmptyReasons_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => ReviewerEligibility.Ineligible(Array.Empty<IneligibilityReason>()));
    }
}
