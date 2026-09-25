using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;
using PeerReview.Infrastructure.Persistence;

namespace PeerReview.Infrastructure.IntegrationTests;

public class DependencyInjectionTests
{
    [Fact]
    public async Task AddInfrastructure_PersistsThroughRepositoriesAndUnitOfWorkAndReadsBackInNewScope()
    {
        // AddInfrastructure() registers PeerReviewDbContext against a fixed, process-wide
        // InMemory database name, so this test overrides it with a unique Guid-based name to
        // stay isolated from every other test resolving the same services.
        var databaseName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddInfrastructure();
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
}
