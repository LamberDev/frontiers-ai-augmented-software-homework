using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Application.Universities;
using PeerReview.Infrastructure.Persistence;
using PeerReview.Infrastructure.Persistence.Repositories;
using PeerReview.Infrastructure.Universities.FrontiersOrganizations;

namespace PeerReview.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PeerReviewDbContext>(options =>
            options.UseInMemoryDatabase(PeerReviewDbContext.DatabaseName));

        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<PeerReviewDbContext>());
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUniversityRepository, UniversityRepository>();

        services.Configure<FrontiersOrganizationsOptions>(
            configuration.GetSection(FrontiersOrganizationsOptions.SectionName));

        services.AddHttpClient<IUniversityDirectory, FrontiersUniversityDirectory>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseAddress);
            client.Timeout = options.Timeout;
        });

        return services;
    }
}
