using PeerReview.Api.Reviewers.InviteReviewer;
using PeerReview.Api.SharedKernel.Http;
using PeerReview.Api.Users.RegisterUser;
using PeerReview.Application;
using PeerReview.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = BodyBindingProblemDetails.Customize);
builder.Services.AddOpenApi();

// Body-binding failures (malformed/type-mismatched JSON body, oversized payload, unsupported
// content type) must never throw, in every environment: minimal API only writes a bare, bodyless
// status code (400/413/415) directly when this is off, which is the framework's own default
// outside Development. Forcing it off in Development too (its default there is on) keeps every
// environment on that same exception-free path, so these client errors are never logged as
// unhandled exceptions by the top-level handler below. app.UseStatusCodePages() (below) turns that
// bare status code into a ProblemDetails response, and BodyBindingProblemDetails.Customize fills
// in its `code`.
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = false);

const string FrontendCorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
{
    policy.WithOrigins(allowedOrigins)
        .WithMethods(HttpMethods.Post)
        .WithHeaders("Content-Type");
}));

var app = builder.Build();

// A single top-level exception handler keeps every genuinely unhandled exception an RFC 9457
// ProblemDetails 500 response, in every environment, without leaking exception details. See
// ExceptionHttpExtensions.WriteProblemAsync.
app.UseExceptionHandler(exceptionApp => exceptionApp.Run(ExceptionHttpExtensions.WriteProblemAsync));

// Turns the bare, bodyless client-error status code minimal API's own body binding writes
// directly (see ThrowOnBadRequest above) into a ProblemDetails response, via
// AddProblemDetails()/BodyBindingProblemDetails.Customize above. Must run before routing/endpoint
// execution (i.e. before the Map* calls below) to wrap around it.
app.UseStatusCodePages();

app.UseCors(FrontendCorsPolicy);

app.MapHealthChecks("/health");
app.MapOpenApi();

app.MapRegisterUserEndpoint();
app.MapInviteReviewerEndpoint();

app.Run();

public partial class Program;
