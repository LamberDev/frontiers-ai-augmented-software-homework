using Microsoft.Extensions.DependencyInjection;
using PeerReview.Application.Reviewers.InviteReviewer;
using PeerReview.Application.Users.RegisterUser;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// Confirms that <c>AddApplication()</c> and <c>AddInfrastructure()</c> together resolve both use
/// case handlers through the composition root, closing out the DI resolution check deferred from
/// T1 (it needs a concrete DI container, only available here through the Api host).
/// </summary>
public class DependencyInjectionTests : IClassFixture<PeerReviewApiFactory>
{
    private readonly PeerReviewApiFactory _factory;

    public DependencyInjectionTests(PeerReviewApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void ServiceProvider_ResolvesRegisterUserHandler()
    {
        using var scope = _factory.Services.CreateScope();

        var handler = scope.ServiceProvider.GetRequiredService<RegisterUserHandler>();

        Assert.NotNull(handler);
    }

    [Fact]
    public void ServiceProvider_ResolvesInviteReviewerHandler()
    {
        using var scope = _factory.Services.CreateScope();

        var handler = scope.ServiceProvider.GetRequiredService<InviteReviewerHandler>();

        Assert.NotNull(handler);
    }
}
