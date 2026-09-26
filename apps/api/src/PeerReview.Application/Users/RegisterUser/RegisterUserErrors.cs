using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.Users.RegisterUser;

public static class RegisterUserErrors
{
    public static readonly Error UniversityNameRequired = new(
        "RegisterUser.UniversityNameRequired",
        "University name is required.",
        ErrorType.Validation);
}
