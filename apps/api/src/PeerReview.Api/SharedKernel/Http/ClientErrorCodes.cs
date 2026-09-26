namespace PeerReview.Api.SharedKernel.Http;

/// <summary>
/// Stable <c>code</c> extension values for the client (4xx) statuses minimal API's own body
/// binding can produce (malformed/type-mismatched JSON, oversized payload, unsupported content
/// type). Shared by <see cref="ExceptionHttpExtensions"/> (a <see cref="BadHttpRequestException"/>
/// that still reaches the top-level exception handler) and <see cref="BodyBindingProblemDetails"/>
/// (the bare, bodyless status code minimal API writes directly, with
/// <c>RouteHandlerOptions.ThrowOnBadRequest = false</c>), so both agree on the same codes.
/// </summary>
internal static class ClientErrorCodes
{
    public const string Invalid = "Request.Invalid";

    public static readonly IReadOnlyDictionary<int, string> ByStatusCode = new Dictionary<int, string>
    {
        [StatusCodes.Status400BadRequest] = "Request.InvalidBody",
        [StatusCodes.Status413PayloadTooLarge] = "Request.PayloadTooLarge",
        [StatusCodes.Status415UnsupportedMediaType] = "Request.UnsupportedMediaType",
    };
}
