using Microsoft.EntityFrameworkCore;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;

namespace PeerReview.Infrastructure.Persistence;

public sealed class PeerReviewDbContext(DbContextOptions<PeerReviewDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public const string DatabaseName = "PeerReview";

    public DbSet<User> Users => Set<User>();

    public DbSet<University> Universities => Set<University>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PeerReviewDbContext).Assembly);
    }
}
