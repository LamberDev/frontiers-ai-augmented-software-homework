using PeerReview.Api.Reviewers.InviteReviewer;
using PeerReview.Api.Users.RegisterUser;
using PeerReview.Application;
using PeerReview.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

const string FrontendCorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
{
    policy.WithOrigins(allowedOrigins)
        .WithMethods(HttpMethods.Post)
        .WithHeaders("Content-Type");
}));

var app = builder.Build();

// A single top-level exception handler keeps every unhandled failure a generic RFC 9457
// ProblemDetails response, in every environment, without leaking exception details.
app.UseExceptionHandler(exceptionApp => exceptionApp.Run(async context =>
{
    await Results.Problem(
        title: "An unexpected error occurred.",
        statusCode: StatusCodes.Status500InternalServerError).ExecuteAsync(context);
}));

app.UseCors(FrontendCorsPolicy);

app.MapHealthChecks("/health");
app.MapOpenApi();

app.MapRegisterUserEndpoint();
app.MapInviteReviewerEndpoint();

app.Run();

public partial class Program;
