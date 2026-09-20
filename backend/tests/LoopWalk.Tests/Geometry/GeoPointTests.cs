using LoopWalk.Core.Geometry;

namespace LoopWalk.Tests.Geometry;

public class GeoPointTests
{
    [Theory]
    [InlineData(91, 0)]
    [InlineData(-91, 0)]
    [InlineData(0, 181)]
    [InlineData(0, -181)]
    [InlineData(double.NaN, 0)]
    [InlineData(0, double.NaN)]
    public void Create_OutOfRange_Throws(double lat, double lon)
        => Assert.Throws<ArgumentOutOfRangeException>(() => GeoPoint.Create(lat, lon));

    [Fact]
    public void ToGeoJsonPosition_IsLonThenLat()
    {
        var position = new GeoPoint(40.7128, -74.0060).ToGeoJsonPosition();

        Assert.Equal(-74.0060, position[0]);
        Assert.Equal(40.7128, position[1]);
    }
}
