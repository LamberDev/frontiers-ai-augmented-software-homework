using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using PeerReview.Api.SharedKernel.Http;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Api.IntegrationTests.SharedKernel.Http;

/// <summary>
/// Unit-tests <see cref="ResultHttpExtensions.ToHttpResult{T}"/> directly against a bare
/// <see cref="DefaultHttpContext"/> rather than through the full HTTP pipeline: no current use
/// case produces a Conflict or a non-directory Failure error through a real endpoint, so a
/// full <c>WebApplicationFactory</c> round trip cannot reach these mappings. Building a
/// <see cref="DefaultHttpContext"/> with just logging and ProblemDetails services registered is
/// the simplest reliable way to execute the returned <see cref="IResult"/> and read back its
/// status code and body.
/// </summary>
public class ResultHttpExtensionsTests
{
    private static readonly Error ConflictError = new("Sample.Conflict", "A conflicting state was found.", ErrorType.Conflict);
    private static readonly Error GenericFailureError = new("Sample.Failure", "Something unrelated to the university directory failed.", ErrorType.Failure);

    [Fact]
    public async Task ToHttpResult_WithConflictError_Writes409ProblemDetailsWithCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(Result.Failure<string>(ConflictError));

        Assert.Equal(StatusCodes.Status409Conflict, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal(ConflictError.Code, root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ToHttpResult_WithNonDirectoryFailureError_Writes500ProblemDetailsWithCode()
    {
        var (statusCode, contentType, body) = await ExecuteAsync(Result.Failure<string>(GenericFailureError));

        Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
        Assert.Equal("application/problem+json", contentType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal(GenericFailureError.Code, root.GetProperty("code").GetString());
    }

    private static async Task<(int StatusCode, string? ContentType, string Body)> ExecuteAsync(Result<string> result)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddProblemDetails();
        await using var serviceProvider = services.BuildServiceProvider();

        var httpContext = new DefaultHttpContext { RequestServices = serviceProvider };
        using var responseBody = new MemoryStream();
        httpContext.Response.Body = responseBody;

        var httpResult = result.ToHttpResult(value => Results.Ok(value));
        await httpResult.ExecuteAsync(httpContext);

        responseBody.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(responseBody);
        var body = await reader.ReadToEndAsync();

        return (httpContext.Response.StatusCode, httpContext.Response.ContentType, body);
    }
}
