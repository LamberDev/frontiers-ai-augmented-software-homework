using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.Universities;

public sealed class University : Entity<Guid>
{
    public const int NameMaxLength = 250;

    public long FrontiersOrganizationId { get; private set; }

    public string Name { get; private set; }

    public decimal? Score { get; private set; }

    private University(Guid id, long frontiersOrganizationId, string name, decimal? score)
        : base(id)
    {
        FrontiersOrganizationId = frontiersOrganizationId;
        Name = name;
        Score = score;
    }

    public static Result<University> Create(long frontiersOrganizationId, string? name, decimal? score)
    {
        var errors = new List<Error>();

        if (frontiersOrganizationId <= 0)
        {
            errors.Add(UniversityErrors.InvalidFrontiersOrganizationId);
        }

        var trimmedName = name?.Trim();

        if (string.IsNullOrEmpty(trimmedName))
        {
            errors.Add(UniversityErrors.NameRequired);
        }
        else if (trimmedName.Length > NameMaxLength)
        {
            errors.Add(UniversityErrors.NameTooLong);
        }

        if (score is < 0)
        {
            errors.Add(UniversityErrors.NegativeScore);
        }

        if (errors.Count > 0)
        {
            return Result.Failure<University>(new ValidationError(errors));
        }

        return Result.Success(new University(Guid.CreateVersion7(), frontiersOrganizationId, trimmedName!, score));
    }
}
