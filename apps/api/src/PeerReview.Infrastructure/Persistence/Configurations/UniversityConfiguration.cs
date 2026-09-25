using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeerReview.Domain.Universities;

namespace PeerReview.Infrastructure.Persistence.Configurations;

public sealed class UniversityConfiguration : IEntityTypeConfiguration<University>
{
    public void Configure(EntityTypeBuilder<University> builder)
    {
        builder.HasKey(university => university.Id);
        builder.Property(university => university.Id).ValueGeneratedNever();

        builder.Property(university => university.Name)
            .IsRequired()
            .HasMaxLength(University.NameMaxLength);

        builder.Property(university => university.Score)
            .HasPrecision(5, 2);

        // The InMemory provider does NOT enforce this unique index: the no-duplicates guarantee
        // for FrontiersOrganizationId comes from the get-or-create logic in the RegisterUser
        // handler (a later step), not from this index.
        builder.HasIndex(university => university.FrontiersOrganizationId).IsUnique();
    }
}
