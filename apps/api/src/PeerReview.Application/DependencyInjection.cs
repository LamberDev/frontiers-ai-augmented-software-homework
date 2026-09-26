using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Reviewers.InviteReviewer;
using PeerReview.Application.Users.RegisterUser;

namespace PeerReview.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<RegisterUserHandler>();
        services.AddScoped<InviteReviewerHandler>();

        return services;
    }
}
