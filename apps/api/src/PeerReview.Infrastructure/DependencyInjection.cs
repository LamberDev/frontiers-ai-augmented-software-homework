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

        services.AddOptions<FrontiersOrganizationsOptions>()
            .Bind(configuration.GetSection(FrontiersOrganizationsOptions.SectionName))
            .Validate(
                options => Uri.TryCreate(options.BaseAddress, UriKind.Absolute, out var baseAddress)
                    && (baseAddress.Scheme == Uri.UriSchemeHttp || baseAddress.Scheme == Uri.UriSchemeHttps),
                "FrontiersOrganizations:BaseAddress must be an absolute http or https URI.")
            .Validate(
                options => options.Timeout > TimeSpan.Zero,
                "FrontiersOrganizations:Timeout must be greater than zero.")
            .ValidateOnStart();

        services.AddHttpClient<IUniversityDirectory, FrontiersUniversityDirectory>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<FrontiersOrganizationsOptions>>().Value;

            // Normalize a BaseAddress without a trailing slash so HttpClient resolves the relative
            // "v1/organizations/elasticSuggestions" path underneath it, instead of replacing its
            // last path segment (standard Uri combination semantics for a relative reference).
            var baseAddress = options.BaseAddress.EndsWith('/')
                ? options.BaseAddress
                : options.BaseAddress + "/";

            client.BaseAddress = new Uri(baseAddress);
            client.Timeout = options.Timeout;
        });

        return services;
    }
}
