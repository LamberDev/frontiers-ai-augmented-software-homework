# syntax=docker/dockerfile:1

# Build stage: restore and publish only. Tests run in CI, not in the image build.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the build configuration and project files first so the restore layer is
# cached until a project or package reference changes.
COPY global.json Directory.Build.props Directory.Packages.props NuGet.Config PeerReview.slnx ./
COPY src/PeerReview.Domain/PeerReview.Domain.csproj src/PeerReview.Domain/
COPY src/PeerReview.Application/PeerReview.Application.csproj src/PeerReview.Application/
COPY src/PeerReview.Infrastructure/PeerReview.Infrastructure.csproj src/PeerReview.Infrastructure/
COPY src/PeerReview.Api/PeerReview.Api.csproj src/PeerReview.Api/
RUN dotnet restore src/PeerReview.Api/PeerReview.Api.csproj

COPY src/ src/
RUN dotnet publish src/PeerReview.Api -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Runtime stage: plain HTTP on 8080 as the image's non-root user.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID

# The runtime image has no curl or wget; docker-compose.yml defines the healthcheck.
ENTRYPOINT ["dotnet", "PeerReview.Api.dll"]
