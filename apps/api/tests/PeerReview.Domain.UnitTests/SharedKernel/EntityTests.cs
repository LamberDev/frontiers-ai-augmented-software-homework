using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.UnitTests.SharedKernel;

public class EntityTests
{
    private sealed class SampleEntity(Guid id) : Entity<Guid>(id)
    {
    }

    private sealed class OtherEntity(Guid id) : Entity<Guid>(id)
    {
    }

    [Fact]
    public void Equals_SameTypeAndId_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var first = new SampleEntity(id);
        var second = new SampleEntity(id);

        Assert.True(first.Equals(second));
        Assert.True(first == second);
        Assert.False(first != second);
    }

    [Fact]
    public void Equals_DifferentId_ReturnsFalse()
    {
        var first = new SampleEntity(Guid.NewGuid());
        var second = new SampleEntity(Guid.NewGuid());

        Assert.False(first.Equals(second));
        Assert.False(first == second);
        Assert.True(first != second);
    }

    [Fact]
    public void Equals_SameIdDifferentConcreteType_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        var sample = new SampleEntity(id);
        var other = new OtherEntity(id);

        Assert.False(sample.Equals(other));
    }

    [Fact]
    public void Equals_SameInstance_ReturnsTrue()
    {
        var entity = new SampleEntity(Guid.NewGuid());

        Assert.True(entity.Equals(entity));
    }

    [Fact]
    public void Equals_Null_ReturnsFalse()
    {
        var entity = new SampleEntity(Guid.NewGuid());

        Assert.False(entity.Equals(null));
        Assert.False(entity.Equals((object?)null));
    }

    [Fact]
    public void EqualityOperator_BothNull_ReturnsTrue()
    {
        SampleEntity? left = null;
        SampleEntity? right = null;

        Assert.True(left == right);
        Assert.False(left != right);
    }

    [Fact]
    public void EqualityOperator_OneNull_ReturnsFalse()
    {
        var entity = new SampleEntity(Guid.NewGuid());
        SampleEntity? nullEntity = null;

        Assert.False(entity == nullEntity);
        Assert.False(nullEntity == entity);
        Assert.True(entity != nullEntity);
    }

    [Fact]
    public void GetHashCode_SameTypeAndId_AreEqual()
    {
        var id = Guid.NewGuid();
        var first = new SampleEntity(id);
        var second = new SampleEntity(id);

        Assert.Equal(first.GetHashCode(), second.GetHashCode());
    }

    [Fact]
    public void Equals_Object_WithNonEntity_ReturnsFalse()
    {
        var entity = new SampleEntity(Guid.NewGuid());

        Assert.False(entity.Equals(new object()));
    }
}
