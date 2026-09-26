using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
}
