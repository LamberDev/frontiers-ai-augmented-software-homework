using Microsoft.EntityFrameworkCore;
using PeerReview.Domain.Universities;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Persistence.Repositories;

namespace PeerReview.Infrastructure.IntegrationTests.Universities;

public class UniversityConfigurationTests
{
    private static DbContextOptions<PeerReviewDbContext> CreateOptions(string databaseName) =>
        new DbContextOptionsBuilder<PeerReviewDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

    [Fact]
    public async Task Score_HasNoPrecisionOrScaleConstraint()
    {
        var databaseName = Guid.NewGuid().ToString();
        await using var context = new PeerReviewDbContext(CreateOptions(databaseName));

        var scoreProperty = context.Model.FindEntityType(typeof(University))!.FindProperty(nameof(University.Score))!;

        Assert.Null(scoreProperty.GetPrecision());
        Assert.Null(scoreProperty.GetScale());
    }

    [Fact]
    public async Task SaveAndRetrieveUniversity_WithHighPrecisionScore_PersistsScoreUnchanged()
    {
        var databaseName = Guid.NewGuid().ToString();
        var university = University.Create(frontiersOrganizationId: 63, name: "Harvard", score: 12345.6789m).Value;

        await using (var writeContext = new PeerReviewDbContext(CreateOptions(databaseName)))
        {
            var repository = new UniversityRepository(writeContext);
            await repository.AddAsync(university, CancellationToken.None);
            await writeContext.SaveChangesAsync(CancellationToken.None);
        }

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));
        var readRepository = new UniversityRepository(readContext);

        var found = await readRepository.GetByIdAsync(university.Id, CancellationToken.None);

        Assert.NotNull(found);
        Assert.Equal(12345.6789m, found!.Score);
    }
}
