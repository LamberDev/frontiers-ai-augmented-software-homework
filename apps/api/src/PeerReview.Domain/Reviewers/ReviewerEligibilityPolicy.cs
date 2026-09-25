using PeerReview.Domain.Users;

namespace PeerReview.Domain.Reviewers;

public static class ReviewerEligibilityPolicy
{
    public const int MinimumPublicationsExclusive = 3;

    public const decimal MinimumUniversityScore = 60m;

    public static ReviewerEligibility Evaluate(User user)
    {
        ArgumentNullException.ThrowIfNull(user);

        var reasons = new List<IneligibilityReason>();

        if (user.NumberOfPublications <= MinimumPublicationsExclusive)
        {
            reasons.Add(ReviewerIneligibilityReasons.InsufficientPublications);
        }

        if (user.University.Score is null)
        {
            reasons.Add(ReviewerIneligibilityReasons.UnknownUniversityScore);
        }
        else if (user.University.Score < MinimumUniversityScore)
        {
            reasons.Add(ReviewerIneligibilityReasons.InsufficientUniversityScore);
        }

        return reasons.Count == 0
            ? ReviewerEligibility.Eligible()
            : ReviewerEligibility.Ineligible(reasons);
    }
}
