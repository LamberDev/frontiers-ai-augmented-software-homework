using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;

namespace PeerReview.Domain.Users;

public sealed class User : Entity<Guid>
{
    public const int UserNameMaxLength = 100;

    public string UserName { get; private set; }

    public int NumberOfPublications { get; private set; }

    public Guid UniversityId { get; private set; }

    public University University { get; private set; }

    // Required by EF Core for materialization.
    private User()
        : base(Guid.Empty)
    {
        UserName = null!;
        University = null!;
    }

    private User(Guid id, string userName, int numberOfPublications, University university)
        : base(id)
    {
        UserName = userName;
        NumberOfPublications = numberOfPublications;
        UniversityId = university.Id;
        University = university;
    }

    public static Result<User> Create(string? userName, int numberOfPublications, University? university)
    {
        var errors = new List<Error>();

        var trimmedUserName = userName?.Trim();

        if (string.IsNullOrEmpty(trimmedUserName))
        {
            errors.Add(UserErrors.UserNameRequired);
        }
        else if (trimmedUserName.Length > UserNameMaxLength)
        {
            errors.Add(UserErrors.UserNameTooLong);
        }

        if (numberOfPublications < 0)
        {
            errors.Add(UserErrors.NegativeNumberOfPublications);
        }

        if (university is null)
        {
            errors.Add(UserErrors.UniversityRequired);
        }

        if (errors.Count > 0)
        {
            return Result.Failure<User>(new ValidationError(errors));
        }

        return Result.Success(new User(Guid.CreateVersion7(), trimmedUserName!, numberOfPublications, university!));
    }
}
