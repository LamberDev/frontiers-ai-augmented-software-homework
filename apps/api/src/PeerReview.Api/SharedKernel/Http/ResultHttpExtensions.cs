using PeerReview.Domain.SharedKernel;

namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Maps the <see cref="Result{T}"/> outcomes returned by every Application handler onto HTTP
/// responses. This lives under a <c>SharedKernel</c> folder, mirroring the Domain's own
/// <c>SharedKernel</c> naming, because the mapping is genuinely cross-cutting: every use case
/// endpoint shares it, so it does not belong to a single business capability folder.
/// </summary>
public static class ResultHttpExtensions
{
    private const string UniversityDirectoryErrorPrefix = "UniversityDirectory.";

    public static IResult ToHttpResult<T>(
        this Result<T> result,
        Func<T, IResult> onSuccess,
        IReadOnlyDictionary<string, string>? fieldMap = null)
    {
        ArgumentNullException.ThrowIfNull(onSuccess);

        return result.IsSuccess ? onSuccess(result.Value) : MapError(result.Error!, fieldMap);
    }

    private static readonly IReadOnlyDictionary<ErrorType, int> StatusCodeByErrorType = new Dictionary<ErrorType, int>
    {
        [ErrorType.Validation] = StatusCodes.Status400BadRequest,
        [ErrorType.NotFound] = StatusCodes.Status404NotFound,
        [ErrorType.Conflict] = StatusCodes.Status409Conflict,
        [ErrorType.Failure] = StatusCodes.Status500InternalServerError,
    };

    private static IResult MapError(Error error, IReadOnlyDictionary<string, string>? fieldMap)
    {
        if (error.Type == ErrorType.Validation)
        {
            return ToValidationProblem(error, fieldMap);
        }

        // A failure of the upstream university directory is a bad gateway, not our own fault.
        var statusCode = error.Type == ErrorType.Failure && IsUniversityDirectoryError(error)
            ? StatusCodes.Status502BadGateway
            : StatusCodeByErrorType.GetValueOrDefault(error.Type, StatusCodes.Status500InternalServerError);

        return Results.Problem(detail: error.Message, statusCode: statusCode, extensions: ErrorExtensions(error));
    }

    private static bool IsUniversityDirectoryError(Error error) =>
        error.Code.StartsWith(UniversityDirectoryErrorPrefix, StringComparison.Ordinal);

    private static IResult ToValidationProblem(Error error, IReadOnlyDictionary<string, string>? fieldMap)
    {
        var errors = error is ValidationError validationError ? validationError.Errors : [error];
        var fieldErrors = new Dictionary<string, List<string>>();

        foreach (var fieldError in errors)
        {
            var field = fieldMap is not null && fieldMap.TryGetValue(fieldError.Code, out var mappedField)
                ? mappedField
                : fieldError.Code;

            if (!fieldErrors.TryGetValue(field, out var messages))
            {
                messages = [];
                fieldErrors[field] = messages;
            }

            messages.Add(fieldError.Message);
        }

        return Results.ValidationProblem(
            fieldErrors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray()),
            extensions: ErrorExtensions(error));
    }

    private static Dictionary<string, object?> ErrorExtensions(Error error) => new() { ["code"] = error.Code };
}
