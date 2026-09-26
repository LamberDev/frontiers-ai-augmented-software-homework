using PeerReview.Api.Reviewers.InviteReviewer;
using PeerReview.Api.SharedKernel.Http;
using PeerReview.Api.Users.RegisterUser;
using PeerReview.Application;
using PeerReview.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

// Body-binding failures must always reach the top-level exception handler, in every environment
// (the framework only throws BadHttpRequestException, instead of writing a bare, bodyless status
// code directly, when this is enabled), so the client always gets a ProblemDetails response.
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);

const string FrontendCorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
{
    policy.WithOrigins(allowedOrigins)
        .WithMethods(HttpMethods.Post)
        .WithHeaders("Content-Type");
}));

var app = builder.Build();

// A single top-level exception handler keeps every unhandled failure an RFC 9457 ProblemDetails
// response, in every environment, without leaking exception details: a BadHttpRequestException
// (malformed or type-mismatched JSON body) maps to its own 400, everything else stays a generic
// 500. See ExceptionHttpExtensions.WriteProblemAsync.
app.UseExceptionHandler(exceptionApp => exceptionApp.Run(ExceptionHttpExtensions.WriteProblemAsync));

app.UseCors(FrontendCorsPolicy);

app.MapHealthChecks("/health");
app.MapOpenApi();

app.MapRegisterUserEndpoint();
app.MapInviteReviewerEndpoint();

app.Run();

public partial class Program;
