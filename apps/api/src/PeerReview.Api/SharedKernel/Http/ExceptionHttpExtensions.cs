using Microsoft.AspNetCore.Diagnostics;

namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Maps an unhandled exception, caught by the single top-level <c>app.UseExceptionHandler(...)</c>
/// in <c>Program.cs</c>, onto an RFC 9457 ProblemDetails response. A malformed or type-mismatched
/// JSON request body fails minimal API model binding before any endpoint handler runs, and
/// surfaces here as a <see cref="BadHttpRequestException"/>; that one gets its own client-facing
/// status code. Every other exception stays a generic 500 without leaking its message or stack
/// trace. This lives under <c>SharedKernel/Http</c>, mirroring <see cref="ResultHttpExtensions"/>,
/// because exception-to-HTTP mapping is cross-cutting, not owned by one business capability.
/// </summary>
public static class ExceptionHttpExtensions
{
    private sealed record ProblemDescriptor(int StatusCode, string Code, string Title, string? Detail);

    private static readonly ProblemDescriptor InvalidRequestBody = new(
        StatusCodes.Status400BadRequest,
        "Request.InvalidBody",
        "Bad Request",
        "The request body is invalid.");

    private static readonly ProblemDescriptor UnexpectedError = new(
        StatusCodes.Status500InternalServerError,
        "Server.UnexpectedError",
        "An unexpected error occurred.",
        Detail: null);

    private static readonly IReadOnlyDictionary<Type, ProblemDescriptor> DescriptorByExceptionType =
        new Dictionary<Type, ProblemDescriptor> { [typeof(BadHttpRequestException)] = InvalidRequestBody };

    public static Task WriteProblemAsync(HttpContext context)
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var descriptor = exception is not null && DescriptorByExceptionType.TryGetValue(exception.GetType(), out var mapped)
            ? mapped
            : UnexpectedError;

        return Results.Problem(
            title: descriptor.Title,
            detail: descriptor.Detail,
            statusCode: descriptor.StatusCode,
            extensions: new Dictionary<string, object?> { ["code"] = descriptor.Code }).ExecuteAsync(context);
    }
}
