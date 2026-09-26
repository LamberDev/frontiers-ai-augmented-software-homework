using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PeerReview.Application.Universities;
using PeerReview.Infrastructure.Persistence;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// A <see cref="WebApplicationFactory{TEntryPoint}"/> that isolates each test run: it replaces the
/// real Frontiers <see cref="IUniversityDirectory"/> with an in-process fake and gives the host its
/// own, uniquely named EF Core InMemory database, so factories never share state with each other.
/// </summary>
public sealed class PeerReviewApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"PeerReview.Api.IntegrationTests-{Guid.NewGuid()}";

    public FakeUniversityDirectory UniversityDirectory { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
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
