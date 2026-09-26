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
    // Known-valid values for the option not under test in a given theory, so each case isolates
    // exactly one failing validation rule instead of relying on the class defaults staying valid.
    private const string ValidBaseAddress = "https://organizations.test/";
    private const string ValidTimeout = "00:00:10";

    private const string InvalidBaseAddressMessage =
        "FrontiersOrganizations:BaseAddress must be an absolute http or https URI.";
    private const string BaseAddressWithQueryOrFragmentMessage =
        "FrontiersOrganizations:BaseAddress must not contain a query string or fragment.";
    private const string InvalidTimeoutMessage =
        "FrontiersOrganizations:Timeout must be greater than zero and at most int.MaxValue milliseconds.";

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
    [InlineData("", InvalidBaseAddressMessage)]
    [InlineData("organizations.test", InvalidBaseAddressMessage)]
    [InlineData("ftp://organizations.test/", InvalidBaseAddressMessage)]
    [InlineData("https://organizations.test/?x=1", BaseAddressWithQueryOrFragmentMessage)]
    [InlineData("https://organizations.test/#frag", BaseAddressWithQueryOrFragmentMessage)]
    public void AddInfrastructure_FrontiersOptions_WithInvalidBaseAddress_ThrowsOptionsValidationExceptionWithExpectedMessage(
        string baseAddress, string expectedMessage)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = baseAddress,
                ["FrontiersOrganizations:Timeout"] = ValidTimeout,
            })
            .Build();

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);

        using var provider = services.BuildServiceProvider();

        // ValidateOnStart() only runs its check when a hosted IHostedService starts, which this
        // plain ServiceCollection does not have. Resolving IOptions<T>.Value runs the same
        // Validate() rules eagerly, which is enough to prove the validation itself is correct.
        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value);

        Assert.Contains(expectedMessage, exception.Failures);
    }

    [Theory]
    [InlineData("00:00:00")]
    [InlineData("-00:00:01")]
    [InlineData("25.00:00:00")] // ~25 days > int.MaxValue milliseconds (~24.86 days).
    public void AddInfrastructure_FrontiersOptions_WithInvalidTimeout_ThrowsOptionsValidationExceptionWithExpectedMessage(
        string timeout)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = ValidBaseAddress,
                ["FrontiersOrganizations:Timeout"] = timeout,
            })
            .Build();

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);

        using var provider = services.BuildServiceProvider();

        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value);

        Assert.Contains(InvalidTimeoutMessage, exception.Failures);
    }

    [Fact]
    public void AddInfrastructure_FrontiersOptions_WithInfiniteTimeout_ThrowsOptionsValidationExceptionWithExpectedMessage()
    {
        // Timeout.InfiniteTimeSpan disables HttpClient's timeout; an unbounded call to Frontiers
        // makes no sense here, so it must be rejected the same as any other out-of-range value.
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontiersOrganizations:BaseAddress"] = ValidBaseAddress,
                ["FrontiersOrganizations:Timeout"] = System.Threading.Timeout.InfiniteTimeSpan.ToString(),
            })
            .Build();

        var services = new ServiceCollection();
        services.AddInfrastructure(configuration);

        using var provider = services.BuildServiceProvider();

        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value);

        Assert.Contains(InvalidTimeoutMessage, exception.Failures);
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
