namespace PeerReview.Infrastructure.IntegrationTests.Universities.FrontiersOrganizations;

/// <summary>
/// Hand-written fake <see cref="HttpMessageHandler"/> used instead of a mocking package to make
/// <see cref="PeerReview.Infrastructure.Universities.FrontiersOrganizations.FrontiersUniversityDirectory"/>
/// tests deterministic and offline. Captures the last outgoing request and delegates the response
/// (or exception) to a caller-supplied handler.
/// </summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _handler;

    public FakeHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
    {
        _handler = handler;
    }

    public HttpRequestMessage? LastRequest { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;

        return _handler(request, cancellationToken);
    }
}
