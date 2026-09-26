using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Reviewers;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.Reviewers.InviteReviewer;

public sealed class InviteReviewerHandler
{
    private const string InvitedMessage = "The invitation to review was sent successfully.";

    private const string NotInvitedMessage = "The user cannot be invited to review.";

    private readonly IUserRepository _userRepository;

    public InviteReviewerHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<ReviewerInvitation>> HandleAsync(InviteReviewerCommand command, CancellationToken cancellationToken)
    {
        if (command.UserId == Guid.Empty)
        {
            return Result.Failure<ReviewerInvitation>(new ValidationError([InviteReviewerErrors.UserIdRequired]));
        }

        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);

        if (user is null)
        {
            return Result.Failure<ReviewerInvitation>(InviteReviewerErrors.UserNotFound);
        }

        var eligibility = ReviewerEligibilityPolicy.Evaluate(user);

        if (eligibility.IsEligible)
        {
            return Result.Success(new ReviewerInvitation(user.Id, Invited: true, InvitedMessage, []));
        }

        var reasons = eligibility.Reasons
            .Select(reason => new ReviewerInvitationReason(reason.Code, reason.Message))
            .ToList();

        return Result.Success(new ReviewerInvitation(user.Id, Invited: false, NotInvitedMessage, reasons));
    }
}
