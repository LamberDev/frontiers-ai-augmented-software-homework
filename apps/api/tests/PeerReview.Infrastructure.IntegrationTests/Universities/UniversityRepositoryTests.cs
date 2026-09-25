using Microsoft.EntityFrameworkCore;
using PeerReview.Domain.Universities;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Persistence.Repositories;

namespace PeerReview.Infrastructure.IntegrationTests.Universities;

public class UniversityRepositoryTests
{
    private static DbContextOptions<PeerReviewDbContext> CreateOptions(string databaseName) =>
        new DbContextOptionsBuilder<PeerReviewDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

    [Fact]
    public async Task GetByFrontiersOrganizationIdAsync_WithExistingUniversity_FindsIt()
    {
        var databaseName = Guid.NewGuid().ToString();
        var university = University.Create(frontiersOrganizationId: 42, name: "MIT", score: 80m).Value;

        await using (var writeContext = new PeerReviewDbContext(CreateOptions(databaseName)))
        {
            var repository = new UniversityRepository(writeContext);
            await repository.AddAsync(university, CancellationToken.None);
            await writeContext.SaveChangesAsync(CancellationToken.None);
        }

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));
        var readRepository = new UniversityRepository(readContext);

        var found = await readRepository.GetByFrontiersOrganizationIdAsync(42, CancellationToken.None);

        Assert.NotNull(found);
        Assert.Equal(university.Id, found!.Id);
    }

    [Fact]
    public async Task GetByFrontiersOrganizationIdAsync_WithUnknownId_ReturnsNull()
    {
        var databaseName = Guid.NewGuid().ToString();

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));
        var repository = new UniversityRepository(readContext);

        var found = await repository.GetByFrontiersOrganizationIdAsync(999, CancellationToken.None);

        Assert.Null(found);
    }

    [Fact]
    public async Task GetByIdAsync_WithExistingUniversity_FindsItWithEqualValues()
    {
        var databaseName = Guid.NewGuid().ToString();
        var university = University.Create(frontiersOrganizationId: 55, name: "Oxford", score: 91.25m).Value;

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
        Assert.Equal(university.Id, found!.Id);
        Assert.Equal(university.FrontiersOrganizationId, found.FrontiersOrganizationId);
        Assert.Equal(university.Name, found.Name);
        Assert.Equal(university.Score, found.Score);
    }

    [Fact]
    public async Task GetByIdAsync_WithUnknownId_ReturnsNull()
    {
        var databaseName = Guid.NewGuid().ToString();

        await using var readContext = new PeerReviewDbContext(CreateOptions(databaseName));
        var repository = new UniversityRepository(readContext);

        var found = await repository.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(found);
    }
}
