using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;

namespace PeerReview.Domain.UnitTests.Universities;

public class UniversityTests
{
    [Fact]
    public void Create_WithValidValues_ReturnsSuccessWithTrimmedNameAndValues()
    {
        var result = University.Create(frontiersOrganizationId: 42, name: "  MIT  ", score: 87.5m);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value.FrontiersOrganizationId);
        Assert.Equal("MIT", result.Value.Name);
        Assert.Equal(87.5m, result.Value.Score);
    }

    [Fact]
    public void Create_WithNullScore_IsAllowed()
    {
        var result = University.Create(frontiersOrganizationId: 1, name: "MIT", score: null);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value.Score);
    }

    [Fact]
    public void Create_WithZeroScore_IsAllowed()
    {
        var result = University.Create(frontiersOrganizationId: 1, name: "MIT", score: 0m);

        Assert.True(result.IsSuccess);
        Assert.Equal(0m, result.Value.Score);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_WithNonPositiveFrontiersOrganizationId_ReturnsInvalidFrontiersOrganizationIdError(long id)
    {
        var result = University.Create(frontiersOrganizationId: id, name: "MIT", score: null);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.InvalidFrontiersOrganizationId.Code);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingName_ReturnsNameRequiredError(string? name)
    {
        var result = University.Create(frontiersOrganizationId: 1, name: name, score: null);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NameRequired.Code);
    }

    [Fact]
    public void Create_WithNameExactlyAtMaxLengthAfterTrim_IsAllowed()
    {
        var name = new string('a', University.NameMaxLength);

        var result = University.Create(frontiersOrganizationId: 1, name: name, score: null);

        Assert.True(result.IsSuccess);
        Assert.Equal(University.NameMaxLength, result.Value.Name.Length);
    }

    [Fact]
    public void Create_WithNameOverMaxLength_ReturnsNameTooLongError()
    {
        var name = new string('a', University.NameMaxLength + 1);

        var result = University.Create(frontiersOrganizationId: 1, name: name, score: null);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NameTooLong.Code);
    }

    [Fact]
    public void Create_WithMaxLengthNameSurroundedByWhitespace_IsTrimmedAndAllowed()
    {
        var name = " " + new string('a', University.NameMaxLength) + " ";

        var result = University.Create(frontiersOrganizationId: 1, name: name, score: null);

        Assert.True(result.IsSuccess);
        Assert.Equal(University.NameMaxLength, result.Value.Name.Length);
    }

    [Fact]
    public void Create_WithNegativeScore_ReturnsNegativeScoreError()
    {
        var result = University.Create(frontiersOrganizationId: 1, name: "MIT", score: -0.01m);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NegativeScore.Code);
    }

    [Fact]
    public void Create_WithMultipleInvalidInputs_AccumulatesAllErrors()
    {
        var result = University.Create(frontiersOrganizationId: 0, name: "", score: -1m);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Equal(3, validationError.Errors.Count);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.InvalidFrontiersOrganizationId.Code);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NameRequired.Code);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NegativeScore.Code);
    }

    [Fact]
    public void Create_ReturnsNonEmptyIdWithVersion7()
    {
        var result = University.Create(frontiersOrganizationId: 1, name: "MIT", score: null);

        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value.Id);
        Assert.Equal(7, result.Value.Id.Version);
    }

    [Fact]
    public void Create_CalledTwice_ReturnsDistinctIds()
    {
        var first = University.Create(frontiersOrganizationId: 1, name: "MIT", score: null);
        var second = University.Create(frontiersOrganizationId: 2, name: "Stanford", score: null);

        Assert.NotEqual(first.Value.Id, second.Value.Id);
    }
}
