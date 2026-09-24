using Microsoft.Extensions.DependencyInjection;

namespace PeerReview.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        return services;
    }
}
