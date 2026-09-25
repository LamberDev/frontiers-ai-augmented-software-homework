using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Infrastructure.Persistence;

namespace PeerReview.Infrastructure.IntegrationTests;

public class DependencyInjectionTests
{
    [Fact]
    public void AddInfrastructure_ResolvesRepositoriesAndUnitOfWorkFromSameDbContextInstance()
    {
        var services = new ServiceCollection();
        services.AddInfrastructure();

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var universityRepository = scope.ServiceProvider.GetRequiredService<IUniversityRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var dbContext = scope.ServiceProvider.GetRequiredService<PeerReviewDbContext>();

        Assert.NotNull(userRepository);
        Assert.NotNull(universityRepository);
        Assert.Same(dbContext, unitOfWork);
    }
}
