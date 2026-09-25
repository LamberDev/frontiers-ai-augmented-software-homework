using Microsoft.EntityFrameworkCore;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Persistence.Repositories;

namespace PeerReview.Infrastructure.IntegrationTests.Users;

public class UserPersistenceTests
{
    private static DbContextOptions<PeerReviewDbContext> CreateOptions(string databaseName) =>
        new DbContextOptionsBuilder<PeerReviewDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

    [Fact]
    public async Task SaveAndRetrieveUser_LoadsUniversityNavigationWithEqualValues()
    {
        var databaseName = Guid.NewGuid().ToString();
        var university = University.Create(frontiersOrganizationId: 1, name: "MIT", score: 87.5m).Value;
        var user = User.Create(userName: "Ada Lovelace", numberOfPublications: 5, university: university).Value;

        await using (var writeContext = new PeerReviewDbContext(CreateOptions(databaseName)))
        {
            var repository = new UserRepository(writeContext);
            await repository.AddAsync(user, CancellationToken.None);
            await writeContext.SaveChangesAsync(CancellationToken.None);
        }

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));
        var readRepository = new UserRepository(readContext);

        var persistedUser = await readRepository.GetByIdAsync(user.Id, CancellationToken.None);

        Assert.NotNull(persistedUser);
        Assert.NotNull(persistedUser!.University);
        Assert.Equal(university.Id, persistedUser.University.Id);
        Assert.Equal(university.Name, persistedUser.University.Name);
        Assert.Equal(university.Score, persistedUser.University.Score);
    }

    [Fact]
    public async Task SaveTwoUsersSharingSameUniversityInstance_ResultsInOneUniversityRowAndMatchingUniversityIds()
    {
        var databaseName = Guid.NewGuid().ToString();
        var university = University.Create(frontiersOrganizationId: 2, name: "Stanford", score: 90m).Value;
        var firstUser = User.Create(userName: "Ada", numberOfPublications: 5, university: university).Value;
        var secondUser = User.Create(userName: "Grace", numberOfPublications: 6, university: university).Value;

        await using (var writeContext = new PeerReviewDbContext(CreateOptions(databaseName)))
        {
            var repository = new UserRepository(writeContext);
            await repository.AddAsync(firstUser, CancellationToken.None);
            await repository.AddAsync(secondUser, CancellationToken.None);
            await writeContext.SaveChangesAsync(CancellationToken.None);
        }

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));

        var universityRows = await readContext.Universities.ToListAsync();
        Assert.Single(universityRows);

        var persistedFirstUser = await readContext.Users.FindAsync([firstUser.Id]);
        var persistedSecondUser = await readContext.Users.FindAsync([secondUser.Id]);

        Assert.NotNull(persistedFirstUser);
        Assert.NotNull(persistedSecondUser);
        Assert.Equal(persistedFirstUser!.UniversityId, persistedSecondUser!.UniversityId);
    }
}
