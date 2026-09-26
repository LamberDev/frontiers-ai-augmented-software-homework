using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.WebUtilities;

namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Maps an unhandled exception, caught by the single top-level <c>app.UseExceptionHandler(...)</c>
/// in <c>Program.cs</c>, onto an RFC 9457 ProblemDetails response. With
/// <c>RouteHandlerOptions.ThrowOnBadRequest = false</c> (every environment, see
/// <c>Program.cs</c>), minimal API's own body-binding failures no longer throw and never reach
/// here (see <see cref="BodyBindingProblemDetails"/> instead); a <see cref="BadHttpRequestException"/>
/// is still matched here (by type hierarchy, since it is not sealed) as defense in depth for any
/// other framework path that may still throw one, honouring its own
/// <see cref="BadHttpRequestException.StatusCode"/> when it is a genuine 4xx (with a stable
/// <c>code</c> looked up by that status, a generic fallback for any other 4xx, and its status
/// code's own reason phrase as the title), and falling back to the generic 500 for any non-4xx
/// status, since that is never a client error. Every other exception stays a generic 500 without
/// leaking its message or stack trace. This lives under <c>SharedKernel/Http</c>, mirroring
/// <see cref="ResultHttpExtensions"/>, because exception-to-HTTP mapping is cross-cutting, not
/// owned by one business capability.
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
        if (bad.StatusCode is < 400 or > 499)
        {
            return UnexpectedError;
        }

        var code = ClientErrorCodes.ByStatusCode.GetValueOrDefault(bad.StatusCode, ClientErrorCodes.Invalid);
        // Never the exception's own message: it can echo back raw request content (e.g. the
        // invalid JSON snippet). Only the well-known 400 body-binding case gets a fixed, safe
        // detail; every other status has none.
        var detail = bad.StatusCode == StatusCodes.Status400BadRequest ? InvalidRequestBodyDetail : null;

        return new ProblemDescriptor(bad.StatusCode, code, ReasonPhrases.GetReasonPhrase(bad.StatusCode), detail);
    }
}
