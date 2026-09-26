using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Api.IntegrationTests.SharedKernel.Http;

/// <summary>
/// Verifies the top-level exception handler (<c>Program.cs</c>, wired through
/// <c>ExceptionHttpExtensions.WriteProblemAsync</c>) keeps an unhandled, unmapped exception a
/// generic RFC 9457 ProblemDetails 500 response that never leaks the exception's message or
/// stack trace.
/// </summary>
public class ExceptionHandlerTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly PeerReviewApiFactory _factory;

    public ExceptionHandlerTests(PeerReviewApiFactory factory) => _factory = factory;

    [Fact]
    public async Task PostUsers_WhenDirectoryThrowsUnhandledException_Returns500ProblemDetailsWithoutLeakingDetails()
    {
        using var client = _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IUniversityDirectory>();
            services.AddSingleton<IUniversityDirectory>(new ThrowingUniversityDirectory());
        })).CreateClient();

        var payload = new { userName = "Ada Lovelace", universityName = "MIT", numberOfPublications = 5 };

        var response = await client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        var root = JsonDocument.Parse(body).RootElement;
        Assert.True(root.TryGetProperty("title", out var title));
        Assert.False(string.IsNullOrWhiteSpace(title.GetString()));
        Assert.DoesNotContain("secret detail", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("Server.UnexpectedError", root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task PostUsers_InProductionEnvironmentWithMalformedJsonBody_Returns400ProblemDetailsWithInvalidBodyCode()
    {
        // RouteHandlerOptions.ThrowOnBadRequest = false is explicit for every environment
        // (Program.cs), so this proves the bare, bodyless 400 minimal API's own body-binding
        // short-circuit writes directly still reaches the client as this same ProblemDetails
        // contract in Production, via app.UseStatusCodePages() and BodyBindingProblemDetails, not
        // through this exception handler.
        using var client = _factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production")).CreateClient();
        var content = new StringContent("{ this is not valid json", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/users", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("Request.InvalidBody", JsonDocument.Parse(body).RootElement.GetProperty("code").GetString());
    }

    private sealed class ThrowingUniversityDirectory : IUniversityDirectory
    {
        public Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("secret detail");
    }
}
