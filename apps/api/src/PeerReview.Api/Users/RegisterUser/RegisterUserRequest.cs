namespace PeerReview.Api.Users.RegisterUser;

public sealed record RegisterUserRequest(string? UserName, string? UniversityName, int? NumberOfPublications);
