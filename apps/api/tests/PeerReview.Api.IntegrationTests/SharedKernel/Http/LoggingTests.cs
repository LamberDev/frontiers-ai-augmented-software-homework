using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;

namespace PeerReview.Api.IntegrationTests.SharedKernel.Http;

/// <summary>
/// Verifies the logging side of the top-level exception handler contract: a client body error
/// (malformed JSON) must never be logged as an unhandled exception at Error level, while a real
/// unhandled exception still is. Each test owns its own <see cref="LogCapturingApiFactory"/> so
/// captured entries never leak between tests.
/// </summary>
public class LoggingTests
{
    [Fact]
    public async Task PostUsers_WithMalformedJsonBody_LogsNoErrorLevelEntry()
    {
        using var factory = new LogCapturingApiFactory();
        using var client = factory.CreateClient();
        var content = new StringContent("{ this is not valid json", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/users", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.DoesNotContain(factory.Logs.Entries, entry => entry.LogLevel == LogLevel.Error);
    }

    [Fact]
    public async Task PostUsers_WhenDirectoryThrowsUnhandledException_LogsAnErrorLevelEntry()
    {
        using var factory = new LogCapturingApiFactory();
        using var client = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IUniversityDirectory>();
            services.AddSingleton<IUniversityDirectory>(new ThrowingUniversityDirectory());
        })).CreateClient();
        var payload = new { userName = "Ada Lovelace", universityName = "MIT", numberOfPublications = 5 };

        var response = await client.PostAsJsonAsync("/api/users", payload);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains(factory.Logs.Entries, entry => entry.LogLevel == LogLevel.Error);
    }

    private sealed class ThrowingUniversityDirectory : IUniversityDirectory
    {
        public Task<Result<UniversityDirectoryEntry>> FindByNameAsync(string universityName, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("secret detail");
    }
}
