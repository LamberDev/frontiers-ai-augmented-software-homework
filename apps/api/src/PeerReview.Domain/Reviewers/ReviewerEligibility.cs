namespace PeerReview.Domain.Reviewers;

public sealed class ReviewerEligibility
{
    public bool IsEligible => Reasons.Count == 0;

    public IReadOnlyList<IneligibilityReason> Reasons { get; }

    private ReviewerEligibility(IReadOnlyList<IneligibilityReason> reasons)
    {
        Reasons = reasons;
    }

    public static ReviewerEligibility Eligible() => new(Array.Empty<IneligibilityReason>());

    public static ReviewerEligibility Ineligible(IReadOnlyList<IneligibilityReason> reasons) => new(reasons);
}
