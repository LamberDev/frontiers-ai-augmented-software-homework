using PeerReview.Application.Reviewers.InviteReviewer;

namespace PeerReview.Api.Reviewers.InviteReviewer;

public sealed record InviteReviewerResponse(
    Guid UserId,
    bool Invited,
    string Message,
    IReadOnlyList<InviteReviewerResponseReason> Reasons)
{
    public static InviteReviewerResponse FromResult(ReviewerInvitation invitation) => new(
        invitation.UserId,
        invitation.Invited,
        invitation.Message,
        invitation.Reasons.Select(reason => new InviteReviewerResponseReason(reason.Code, reason.Message)).ToList());
}

public sealed record InviteReviewerResponseReason(string Code, string Message);
