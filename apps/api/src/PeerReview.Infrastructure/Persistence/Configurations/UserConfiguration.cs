using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeerReview.Domain.Users;

namespace PeerReview.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Id).ValueGeneratedNever();

        builder.Property(user => user.UserName)
            .IsRequired()
            .HasMaxLength(User.UserNameMaxLength);

        builder.HasOne(user => user.University)
            .WithMany()
            .HasForeignKey(user => user.UniversityId)
            .IsRequired();
    }
}
