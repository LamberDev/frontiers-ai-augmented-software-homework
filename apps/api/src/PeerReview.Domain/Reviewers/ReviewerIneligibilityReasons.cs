namespace PeerReview.Domain.Reviewers;

public static class ReviewerIneligibilityReasons
{
    public static readonly IneligibilityReason InsufficientPublications = new(
        "Reviewer.InsufficientPublications",
        $"User must have more than {ReviewerEligibilityPolicy.MinimumPublicationsExclusive} publications.");

    public static readonly IneligibilityReason InsufficientUniversityScore = new(
        "Reviewer.InsufficientUniversityScore",
        $"University score must be at least {ReviewerEligibilityPolicy.MinimumUniversityScore}.");

    public static readonly IneligibilityReason UnknownUniversityScore = new(
        "Reviewer.UnknownUniversityScore",
        "University score is unknown.");
}
