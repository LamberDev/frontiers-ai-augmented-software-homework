namespace PeerReview.Application.Reviewers.InviteReviewer;

public sealed record ReviewerInvitation(
    Guid UserId,
    bool Invited,
    string Message,
    IReadOnlyList<ReviewerInvitationReason> Reasons);

public sealed record ReviewerInvitationReason(string Code, string Message);
