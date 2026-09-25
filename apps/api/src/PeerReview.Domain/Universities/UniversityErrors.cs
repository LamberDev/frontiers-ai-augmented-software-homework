using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.Universities;

public static class UniversityErrors
{
    public static readonly Error InvalidFrontiersOrganizationId = new(
        "University.InvalidFrontiersOrganizationId",
        "Frontiers organization id must be greater than 0.",
        ErrorType.Validation);

    public static readonly Error NameRequired = new(
        "University.NameRequired",
        "University name is required.",
        ErrorType.Validation);

    public static readonly Error NameTooLong = new(
        "University.NameTooLong",
        $"University name must be at most {University.NameMaxLength} characters.",
        ErrorType.Validation);

    public static readonly Error NegativeScore = new(
        "University.NegativeScore",
        "University score must not be negative.",
        ErrorType.Validation);
}
