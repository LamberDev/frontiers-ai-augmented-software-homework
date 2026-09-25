namespace PeerReview.Application.Users.RegisterUser;

public sealed record RegisteredUser(
    Guid UserId,
    string UserName,
    int NumberOfPublications,
    RegisteredUserUniversity University);

public sealed record RegisteredUserUniversity(
    Guid Id,
    long FrontiersOrganizationId,
    string Name,
    decimal? Score);
