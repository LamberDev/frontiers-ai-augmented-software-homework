using System.Text.Json;
using PeerReview.Api.SharedKernel.Http;
using PeerReview.Application.Reviewers.InviteReviewer;

namespace PeerReview.Api.Reviewers.InviteReviewer;

public static class InviteReviewerEndpoint
{
    private const string UserIdField = "userId";

    private static readonly IReadOnlyDictionary<string, string> FieldMap = new Dictionary<string, string>
    {
        [InviteReviewerErrors.UserIdRequired.Code] = UserIdField,
    };

    public static IEndpointRouteBuilder MapInviteReviewerEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviewers/invitations", HandleAsync)
            .WithName("InviteReviewer")
            .WithSummary("Evaluates a user's eligibility and invites them to review when eligible.")
            .Produces<InviteReviewerResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<IResult> HandleAsync(
        HttpContext httpContext,
        InviteReviewerHandler handler,
        CancellationToken cancellationToken)
    {
        InviteReviewerRequest? request;

        try
        {
            request = await httpContext.Request.ReadFromJsonAsync<InviteReviewerRequest>(cancellationToken);
        }
        catch (JsonException)
        {
            return InvalidUserIdProblem();
        }
        catch (InvalidOperationException)
        {
            return InvalidUserIdProblem();
        }

        if (request is null || !Guid.TryParse(request.UserId, out var userId))
        {
            return InvalidUserIdProblem();
        }

        var command = new InviteReviewerCommand(userId);
        var result = await handler.HandleAsync(command, cancellationToken);

        return result.ToHttpResult(
            invitation => Results.Ok(InviteReviewerResponse.FromResult(invitation)),
            FieldMap);
    }

    private static IResult InvalidUserIdProblem() => Results.ValidationProblem(new Dictionary<string, string[]>
    {
        [UserIdField] = ["User id must be a valid GUID."],
    });
}
