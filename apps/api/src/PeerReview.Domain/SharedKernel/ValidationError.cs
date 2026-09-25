namespace PeerReview.Domain.SharedKernel;

public sealed record ValidationError : Error
{
    public IReadOnlyList<Error> Errors { get; }

    public ValidationError(IReadOnlyList<Error> errors)
        : base("Validation.Failed", "One or more validation errors occurred.", ErrorType.Validation)
    {
        ArgumentNullException.ThrowIfNull(errors);

        if (errors.Count == 0)
        {
            throw new ArgumentException("Validation error must contain at least one error.", nameof(errors));
        }

        Errors = errors;
    }
}
