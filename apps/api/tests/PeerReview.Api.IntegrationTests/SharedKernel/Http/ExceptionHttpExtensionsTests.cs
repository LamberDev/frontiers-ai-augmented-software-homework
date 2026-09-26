using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using PeerReview.Api.SharedKernel.Http;

namespace PeerReview.Api.IntegrationTests.SharedKernel.Http;

/// <summary>
/// Unit-tests <see cref="ExceptionHttpExtensions.WriteProblemAsync"/> directly against a bare
/// <see cref="DefaultHttpContext"/>, the same way <see cref="ResultHttpExtensionsTests"/> tests
/// <see cref="ResultHttpExtensions"/>. <see cref="BadHttpRequestException"/> has a public
/// constructor accepting any status code, so every status it can carry (400, 413, 415, or any
/// other 4xx) is exercised here directly, without depending on which of them a real HTTP request
/// can actually trigger in this ASP.NET Core version (see
/// <c>RegisterUserEndpointTests.PostUsers_WithUnsupportedContentType_...</c> for the one real
/// request behavior that differs from what this exception carries).
/// </summary>
public class ExceptionHttpExtensionsTests
{
    [Fact]
    public async Task WriteProblemAsync_WithBadHttpRequestExceptionAt400_Writes400ProblemDetailsWithInvalidBodyCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(
            new BadHttpRequestException("secret detail", StatusCodes.Status400BadRequest));

        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Request.InvalidBody", root.GetProperty("code").GetString());
        Assert.Equal("The request body is invalid.", root.GetProperty("detail").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    [Fact]
    public async Task WriteProblemAsync_WithBadHttpRequestExceptionAt413_Keeps413WithPayloadTooLargeCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(
            new BadHttpRequestException("secret detail", StatusCodes.Status413PayloadTooLarge));

        Assert.Equal(StatusCodes.Status413PayloadTooLarge, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Request.PayloadTooLarge", root.GetProperty("code").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    [Fact]
    public async Task WriteProblemAsync_WithBadHttpRequestExceptionAt415_Keeps415WithUnsupportedMediaTypeCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(
            new BadHttpRequestException("secret detail", StatusCodes.Status415UnsupportedMediaType));

        Assert.Equal(StatusCodes.Status415UnsupportedMediaType, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Request.UnsupportedMediaType", root.GetProperty("code").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    [Fact]
    public async Task WriteProblemAsync_WithBadHttpRequestExceptionAtUnmappedClientStatus_KeepsThatStatusWithFallbackCodeAndReasonPhraseTitle()
    {
        var (statusCode, _, body) = await ExecuteAsync(
            new BadHttpRequestException("secret detail", StatusCodes.Status422UnprocessableEntity));

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, statusCode);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Request.Invalid", root.GetProperty("code").GetString());
        Assert.Equal(
            ReasonPhrases.GetReasonPhrase(StatusCodes.Status422UnprocessableEntity),
            root.GetProperty("title").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    [Fact]
    public async Task WriteProblemAsync_WithBadHttpRequestExceptionAtNon4xxStatus_TreatsItAsTheGeneric500()
    {
        var (statusCode, _, body) = await ExecuteAsync(
            new BadHttpRequestException("secret detail", StatusCodes.Status503ServiceUnavailable));

        Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Server.UnexpectedError", root.GetProperty("code").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    [Fact]
    public async Task WriteProblemAsync_WithAnyOtherException_Writes500ProblemDetailsWithUnexpectedErrorCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(new InvalidOperationException("secret detail"));

        Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Server.UnexpectedError", root.GetProperty("code").GetString());
        Assert.DoesNotContain("secret detail", body);
    }

    private static async Task<(int StatusCode, string? ContentType, string Body)> ExecuteAsync(Exception exception)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddProblemDetails();
        await using var serviceProvider = services.BuildServiceProvider();

        var httpContext = new DefaultHttpContext { RequestServices = serviceProvider };
        httpContext.Features.Set<IExceptionHandlerFeature>(new ExceptionHandlerFeature { Error = exception });
        using var responseBody = new MemoryStream();
        httpContext.Response.Body = responseBody;

        await ExceptionHttpExtensions.WriteProblemAsync(httpContext);

        responseBody.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(responseBody);
        var body = await reader.ReadToEndAsync();

        return (httpContext.Response.StatusCode, httpContext.Response.ContentType, body);
    }
}
