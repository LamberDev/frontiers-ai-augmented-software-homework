using PeerReview.Api.SharedKernel.Http;
using PeerReview.Application.Users.RegisterUser;
using PeerReview.Domain.Users;

namespace PeerReview.Api.Users.RegisterUser;

public static class RegisterUserEndpoint
{
    private static readonly IReadOnlyDictionary<string, string> FieldMap = new Dictionary<string, string>
    {
        [RegisterUserErrors.UniversityNameRequired.Code] = "universityName",
        [UserErrors.UserNameRequired.Code] = "userName",
        [UserErrors.UserNameTooLong.Code] = "userName",
        [UserErrors.NegativeNumberOfPublications.Code] = "numberOfPublications",
        [UserErrors.UniversityRequired.Code] = "universityName",
    };

    public static IEndpointRouteBuilder MapRegisterUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/users", HandleAsync)
            .WithName("RegisterUser")
            .WithSummary("Registers a new user with their university.")
            .Produces<RegisterUserResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status502BadGateway);

        return app;
    }

    private static async Task<IResult> HandleAsync(
        RegisterUserRequest request,
        RegisterUserHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new RegisterUserCommand(
            request.UserName ?? string.Empty,
            request.UniversityName ?? string.Empty,
            request.NumberOfPublications);

        var result = await handler.HandleAsync(command, cancellationToken);

        return result.ToHttpResult(
            registered => Results.Created((string?)null, RegisterUserResponse.FromResult(registered)),
            FieldMap);
    }
}
