using PeerReview.Domain.SharedKernel;

namespace PeerReview.Application.Universities;

public static class UniversityDirectoryErrors
{
    public static readonly Error NotFound = new(
        "UniversityDirectory.NotFound",
        "No university matching the given name was found.",
        ErrorType.NotFound);

    public static readonly Error Unavailable = new(
        "UniversityDirectory.Unavailable",
        "The university directory is currently unavailable.",
        ErrorType.Failure);
}
