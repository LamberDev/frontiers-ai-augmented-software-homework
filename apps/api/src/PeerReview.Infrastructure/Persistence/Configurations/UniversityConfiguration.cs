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

        // No HasPrecision: Score has no upper bound by design (confirmed decision), so it must
        // not be constrained to a fixed precision/scale once a relational provider is used.

        // The InMemory provider does NOT enforce this unique index: the no-duplicates guarantee
        // for FrontiersOrganizationId comes from the get-or-create logic in the RegisterUser
        // handler (a later step), not from this index.
        builder.HasIndex(university => university.FrontiersOrganizationId).IsUnique();
    }
}
