namespace PeerReview.Application.Users.RegisterUser;

public sealed record RegisterUserCommand(string UserName, string UniversityName, int NumberOfPublications);
