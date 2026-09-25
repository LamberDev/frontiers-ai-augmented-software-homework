using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.UnitTests.SharedKernel;

public class ValidationErrorTests
{
    [Fact]
    public void Constructor_WithErrors_CarriesAllErrorsAndValidationType()
    {
        var errors = new Error[]
        {
            new("First.Error", "First error.", ErrorType.Validation),
            new("Second.Error", "Second error.", ErrorType.Validation),
        };

        var validationError = new ValidationError(errors);

        Assert.Equal("Validation.Failed", validationError.Code);
        Assert.Equal("One or more validation errors occurred.", validationError.Message);
        Assert.Equal(ErrorType.Validation, validationError.Type);
        Assert.Equal(errors, validationError.Errors);
    }

    [Fact]
    public void Constructor_WithNullErrors_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => new ValidationError(null!));
    }

    [Fact]
    public void Constructor_WithEmptyErrors_Throws()
    {
        Assert.Throws<ArgumentException>(() => new ValidationError([]));
    }
}
