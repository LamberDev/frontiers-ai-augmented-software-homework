using Microsoft.AspNetCore.WebUtilities;

namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Fills in the stable <c>code</c> (and, when still unset, a status-derived title) for a
/// ProblemDetails response that does not already carry one. With
/// <c>RouteHandlerOptions.ThrowOnBadRequest = false</c> (every environment, see
/// <c>Program.cs</c>), minimal API's own body-binding failures (malformed/type-mismatched JSON
/// body, oversized payload, unsupported content type) never throw: they write a bare status code
/// with an empty body, and <c>app.UseStatusCodePages()</c> (<c>Program.cs</c>) turns that into a
/// ProblemDetails response through <see cref="Microsoft.AspNetCore.Http.IProblemDetailsService"/>,
/// invoking <see cref="Customize"/> as its <c>CustomizeProblemDetails</c> callback. A response that
/// already has a <c>code</c> (an endpoint's own <c>ValidationProblem</c>, or
/// <see cref="ResultHttpExtensions"/>) is left untouched, and a non-4xx status is never labeled a
/// client error.
/// </summary>
public static class BodyBindingProblemDetails
{
    private const string CodeExtensionKey = "code";

    public static void Customize(ProblemDetailsContext context)
    {
        var problemDetails = context.ProblemDetails;

        if (problemDetails.Extensions.ContainsKey(CodeExtensionKey))
        {
            return;
        }

        var statusCode = problemDetails.Status ?? context.HttpContext.Response.StatusCode;

        if (statusCode is < 400 or > 499)
        {
            return;
        }

        problemDetails.Extensions[CodeExtensionKey] = ClientErrorCodes.ByStatusCode.GetValueOrDefault(statusCode, ClientErrorCodes.Invalid);
        problemDetails.Title ??= ReasonPhrases.GetReasonPhrase(statusCode);
    }
}
