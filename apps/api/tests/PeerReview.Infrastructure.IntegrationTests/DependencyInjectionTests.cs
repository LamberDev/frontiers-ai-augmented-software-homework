using System.Diagnostics;
using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Application.Universities;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;
using PeerReview.Infrastructure.IntegrationTests.Universities.FrontiersOrganizations;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Universities.FrontiersOrganizations;

namespace PeerReview.Infrastructure.IntegrationTests;

public class DependencyInjectionTests
{
    private static IConfiguration EmptyConfiguration => new ConfigurationBuilder().Build();

    [Fact]
    public async Task AddInfrastructure_PersistsThroughRepositoriesAndUnitOfWorkAndReadsBackInNewScope()
    {
        // AddInfrastructure() registers PeerReviewDbContext against a fixed, process-wide
        // InMemory database name, so this test overrides it with a unique Guid-based name to
        // stay isolated from every other test resolving the same services.
        var databaseName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddInfrastructure(EmptyConfiguration);
        services.AddDbContext<PeerReviewDbContext>(options => options.UseInMemoryDatabase(databaseName));

        using var provider = services.BuildServiceProvider();
        Guid userId;

        using (var writeScope = provider.CreateScope())
        {
            var universityRepository = writeScope.ServiceProvider.GetRequiredService<IUniversityRepository>();
            var userRepository = writeScope.ServiceProvider.GetRequiredService<IUserRepository>();
            var unitOfWork = writeScope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var university = University.Create(frontiersOrganizationId: 7, name: "Cambridge", score: 75m).Value;
            var user = User.Create(userName: "Alan Turing", numberOfPublications: 10, university: university).Value;
            userId = user.Id;

            await universityRepository.AddAsync(university, CancellationToken.None);
            await userRepository.AddAsync(user, CancellationToken.None);
            await unitOfWork.SaveChangesAsync(CancellationToken.None);
        }

        using var readScope = provider.CreateScope();
        var readUserRepository = readScope.ServiceProvider.GetRequiredService<IUserRepository>();

        var persistedUser = await readUserRepository.GetByIdAsync(userId, CancellationToken.None);

        Assert.NotNull(persistedUser);
        Assert.Equal("Alan Turing", persistedUser!.UserName);
        Assert.NotNull(persistedUser.University);
        Assert.Equal("Cambridge", persistedUser.University.Name);
    }

    [Fact]
    public async Task AddInfrastructure_FrontiersUniversityDirectory_CallsConfiguredBaseAddress()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = "https://organizations.test/",
            })
            .Build();
        var handler = new FakeHttpMessageHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""[{"id":1327079645,"organizationName":"Harvard University","score":94.3555}]"""),
        }));

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);
        services.AddHttpClient<IUniversityDirectory, FrontiersUniversityDirectory>()
            .ConfigurePrimaryHttpMessageHandler(() => handler);

        using var provider = services.BuildServiceProvider();
        var directory = provider.GetRequiredService<IUniversityDirectory>();

        var result = await directory.FindByNameAsync("Harvard", CancellationToken.None);

        Assert.IsType<FrontiersUniversityDirectory>(directory);
        Assert.True(result.IsSuccess);
        Assert.Equal(
            "https://organizations.test/v1/organizations/elasticSuggestions",
            handler.LastRequest!.RequestUri!.GetLeftPart(UriPartial.Path));
    }

    [Theory]
    [InlineData("")]
    [InlineData("organizations.test")]
    [InlineData("ftp://organizations.test/")]
    public void AddInfrastructure_FrontiersOptions_WithInvalidBaseAddress_ThrowsOptionsValidationExceptionOnResolve(
        string baseAddress)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = baseAddress,
            })
            .Build();

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);

        using var provider = services.BuildServiceProvider();

        // ValidateOnStart() only runs its check when a hosted IHostedService starts, which this
        // plain ServiceCollection does not have. Resolving IOptions<T>.Value runs the same
        // Validate() rules eagerly, which is enough to prove the validation itself is correct.
        Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value);
    }

    [Theory]
    [InlineData("00:00:00")]
    [InlineData("-00:00:01")]
    public void AddInfrastructure_FrontiersOptions_WithInvalidTimeout_ThrowsOptionsValidationExceptionOnResolve(
        string timeout)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:Timeout"] = timeout,
            })
            .Build();

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);

        using var provider = services.BuildServiceProvider();

        Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value);
    }

    [Fact]
    public async Task AddInfrastructure_FrontiersUniversityDirectory_WithBaseAddressMissingTrailingSlash_RequestsUnderConfiguredPrefix()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = "https://organizations.test/api-prefix",
            })
            .Build();
        var handler = new FakeHttpMessageHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("[]"),
        }));

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);
        services.AddHttpClient<IUniversityDirectory, FrontiersUniversityDirectory>()
            .ConfigurePrimaryHttpMessageHandler(() => handler);

        using var provider = services.BuildServiceProvider();
        var directory = provider.GetRequiredService<IUniversityDirectory>();

        await directory.FindByNameAsync("Harvard", CancellationToken.None);

        Assert.Equal(
            "https://organizations.test/api-prefix/v1/organizations/elasticSuggestions",
            handler.LastRequest!.RequestUri!.GetLeftPart(UriPartial.Path));
    }

    [Fact]
    public async Task AddInfrastructure_FrontiersUniversityDirectory_UsesConfiguredTimeoutToAbortSlowRequests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = "https://organizations.test/",
                ["FrontiersOrganizations:Timeout"] = "00:00:00.2",
            })
            .Build();
        var handler = new FakeHttpMessageHandler(async (_, token) =>
        {
            // Honors the cancellation token so this fake behaves like a real slow upstream being
            // aborted by HttpClient.Timeout, instead of hanging past the client's own deadline.
            await Task.Delay(TimeSpan.FromSeconds(5), token);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);
        services.AddHttpClient<IUniversityDirectory, FrontiersUniversityDirectory>()
            .ConfigurePrimaryHttpMessageHandler(() => handler);

        using var provider = services.BuildServiceProvider();
        var directory = provider.GetRequiredService<IUniversityDirectory>();

        var stopwatch = Stopwatch.StartNew();
        var result = await directory.FindByNameAsync("Harvard", CancellationToken.None);
        stopwatch.Stop();

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
        Assert.True(
            stopwatch.Elapsed < TimeSpan.FromSeconds(2),
            $"Expected the configured 200ms client timeout to abort the request quickly, took {stopwatch.Elapsed}.");
    }
}
