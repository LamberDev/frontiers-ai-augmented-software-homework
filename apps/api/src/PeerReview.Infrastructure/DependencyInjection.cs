using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Persistence.Repositories;

namespace PeerReview.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<PeerReviewDbContext>(options =>
            options.UseInMemoryDatabase(PeerReviewDbContext.DatabaseName));

        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<PeerReviewDbContext>());
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUniversityRepository, UniversityRepository>();

        return services;
    }
}
