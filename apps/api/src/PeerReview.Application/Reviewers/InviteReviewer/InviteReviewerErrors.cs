using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.Reviewers.InviteReviewer;

public static class InviteReviewerErrors
{
    public static readonly Error UserIdRequired = new(
        "Reviewer.UserIdRequired",
        "User id is required.",
        ErrorType.Validation);

    public static readonly Error UserNotFound = new(
        "Reviewer.UserNotFound",
        "No user was found with the given id.",
        ErrorType.NotFound);
}
