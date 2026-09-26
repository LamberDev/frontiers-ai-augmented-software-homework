using PeerReview.Application.Users.RegisterUser;

namespace PeerReview.Api.Users.RegisterUser;

public sealed record RegisterUserResponse(
    Guid UserId,
    string UserName,
    int NumberOfPublications,
    RegisterUserResponseUniversity University)
{
    public static RegisterUserResponse FromResult(RegisteredUser registered) => new(
        registered.UserId,
        registered.UserName,
        registered.NumberOfPublications,
        new RegisterUserResponseUniversity(
            registered.University.Id,
            registered.University.FrontiersOrganizationId,
            registered.University.Name,
            registered.University.Score));
}

public sealed record RegisterUserResponseUniversity(Guid Id, long FrontiersOrganizationId, string Name, decimal? Score);
