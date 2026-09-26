using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using PeerReview.Application.Universities;
using PeerReview.Infrastructure.Persistence;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// A <see cref="WebApplicationFactory{TEntryPoint}"/>, isolated the same way as
/// <see cref="PeerReviewApiFactory"/>, that additionally registers an <see cref="InMemoryLoggerProvider"/>
/// so a test can assert on what the host actually logged for a request. Instantiate one per test
/// method (not shared) so captured entries never leak between tests.
/// </summary>
public sealed class LogCapturingApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"PeerReview.Api.IntegrationTests-{Guid.NewGuid()}";

    public FakeUniversityDirectory UniversityDirectory { get; } = new();

    public InMemoryLoggerProvider Logs { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureLogging(logging => logging.AddProvider(Logs));

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IUniversityDirectory>();
            services.AddSingleton<IUniversityDirectory>(UniversityDirectory);

            services.RemoveAll<DbContextOptions<PeerReviewDbContext>>();
            services.RemoveAll<PeerReviewDbContext>();
            services.AddDbContext<PeerReviewDbContext>(options => options.UseInMemoryDatabase(_databaseName));
        });
    }
}
