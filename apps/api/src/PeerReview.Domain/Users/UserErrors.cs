using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.Users;

public static class UserErrors
{
    public static readonly Error UserNameRequired = new(
        "User.UserNameRequired",
        "User name is required.",
        ErrorType.Validation);

    public static readonly Error UserNameTooLong = new(
        "User.UserNameTooLong",
        $"User name must be at most {User.UserNameMaxLength} characters.",
        ErrorType.Validation);

    public static readonly Error NegativeNumberOfPublications = new(
        "User.NegativeNumberOfPublications",
        "Number of publications must not be negative.",
        ErrorType.Validation);

    public static readonly Error UniversityRequired = new(
        "User.UniversityRequired",
        "University is required.",
        ErrorType.Validation);
}
