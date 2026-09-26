using Microsoft.AspNetCore.Diagnostics;

namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Maps an unhandled exception, caught by the single top-level <c>app.UseExceptionHandler(...)</c>
/// in <c>Program.cs</c>, onto an RFC 9457 ProblemDetails response. A malformed or type-mismatched
/// JSON request body fails minimal API model binding before any endpoint handler runs, and
/// surfaces here as a <see cref="BadHttpRequestException"/> (matched by type hierarchy, since it is
/// not sealed): its own <see cref="BadHttpRequestException.StatusCode"/> is kept as-is (400 for an
/// invalid body, but also whatever other framework client status it may carry, e.g. 413 or 415),
/// with a stable <c>code</c> looked up by that status and a generic fallback for any other 4xx.
/// Every other exception stays a generic 500 without leaking its message or stack trace. This lives
/// under <c>SharedKernel/Http</c>, mirroring <see cref="ResultHttpExtensions"/>, because
/// exception-to-HTTP mapping is cross-cutting, not owned by one business capability.
/// </summary>
public static class ExceptionHttpExtensions
{
    private sealed record ProblemDescriptor(int StatusCode, string Code, string Title, string? Detail);

    private static readonly ProblemDescriptor UnexpectedError = new(
        StatusCodes.Status500InternalServerError,
        "Server.UnexpectedError",
        "An unexpected error occurred.",
        Detail: null);

    private const string InvalidRequestBodyDetail = "The request body is invalid.";

    // Never the exception's own message: it can echo back raw request content (e.g. the invalid
    // JSON snippet). Only the well-known 400 body-binding case gets a fixed, safe detail; every
    // other status has none.
    private static readonly IReadOnlyDictionary<int, (string Code, string Title)> BadRequestDescriptorByStatusCode =
        new Dictionary<int, (string Code, string Title)>
        {
            [StatusCodes.Status400BadRequest] = ("Request.InvalidBody", "Bad Request"),
            [StatusCodes.Status413PayloadTooLarge] = ("Request.PayloadTooLarge", "Payload Too Large"),
            [StatusCodes.Status415UnsupportedMediaType] = ("Request.UnsupportedMediaType", "Unsupported Media Type"),
        };

    private static readonly (string Code, string Title) FallbackBadRequestDescriptor = ("Request.Invalid", "Bad Request");

    public static Task WriteProblemAsync(HttpContext context)
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var descriptor = exception is BadHttpRequestException bad ? DescribeBadRequest(bad) : UnexpectedError;

        return Results.Problem(
            title: descriptor.Title,
            detail: descriptor.Detail,
            statusCode: descriptor.StatusCode,
            extensions: new Dictionary<string, object?> { ["code"] = descriptor.Code }).ExecuteAsync(context);
    }

    private static ProblemDescriptor DescribeBadRequest(BadHttpRequestException bad)
    {
        var (code, title) = BadRequestDescriptorByStatusCode.GetValueOrDefault(bad.StatusCode, FallbackBadRequestDescriptor);
        var detail = bad.StatusCode == StatusCodes.Status400BadRequest ? InvalidRequestBodyDetail : null;

        return new ProblemDescriptor(bad.StatusCode, code, title, detail);
    }
}
