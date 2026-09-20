using LoopWalk.Core.Geometry;

namespace LoopWalk.Tests.Geometry;

public class RouteGeometryServiceTests
{
    private readonly RouteGeometryService _sut = new();

    private static readonly GeoPoint NewYork = new(40.7128, -74.0060);

    [Theory]
    [InlineData(0)]
    [InlineData(45)]
    [InlineData(90)]
    [InlineData(180)]
    [InlineData(270)]
    [InlineData(359.9)]
    public void Project_ThenMeasure_ReturnsOriginalDistance(double bearing)
    {
        const double distance = 2_500;

        var projected = _sut.Project(NewYork, distance, bearing);

        Assert.Equal(distance, _sut.DistanceMeters(NewYork, projected), 0.001);
    }

    [Fact]
    public void Project_DueNorth_IncreasesLatitudeOnly()
    {
        var projected = _sut.Project(NewYork, 1_000, bearingDegrees: 0);

        Assert.True(projected.Lat > NewYork.Lat);
        Assert.Equal(NewYork.Lon, projected.Lon, 0.000001);
    }

    [Fact]
    public void Project_DueEast_IncreasesLongitude()
    {
        var projected = _sut.Project(NewYork, 1_000, bearingDegrees: 90);

        Assert.True(projected.Lon > NewYork.Lon);
    }

    [Fact]
    public void Project_ZeroDistance_ReturnsOrigin()
    {
        var projected = _sut.Project(NewYork, 0, bearingDegrees: 137);

        Assert.Equal(NewYork.Lat, projected.Lat, 0.000001);
        Assert.Equal(NewYork.Lon, projected.Lon, 0.000001);
    }

    [Fact]
    public void Project_AcrossAntimeridian_WrapsLongitudeIntoRange()
    {
        var nearDateLine = new GeoPoint(0, 179.99);

        var projected = _sut.Project(nearDateLine, 10_000, bearingDegrees: 90);

        Assert.InRange(projected.Lon, -180, 180);
        Assert.True(projected.Lon < 0, "Crossing east past 180 should wrap to a negative longitude.");
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(double.NaN)]
    public void Project_InvalidDistance_Throws(double distance)
        => Assert.Throws<ArgumentOutOfRangeException>(() => _sut.Project(NewYork, distance, 0));

    [Fact]
    public void DistanceMeters_SamePoint_IsZero()
        => Assert.Equal(0, _sut.DistanceMeters(NewYork, NewYork), 0.000001);

    [Fact]
    public void DistanceMeters_KnownPair_MatchesPublishedValue()
    {
        // New York -> London, ~5,570 km great-circle.
        var london = new GeoPoint(51.5074, -0.1278);

        var distance = _sut.DistanceMeters(NewYork, london);

        Assert.InRange(distance, 5_560_000, 5_580_000);
    }

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(8)]
    public void BuildLoopWaypoints_ReturnsRequestedCount(int count)
    {
        var waypoints = _sut.BuildLoopWaypoints(NewYork, radiusMeters: 800, bearingDegrees: 30, count);

        Assert.Equal(count, waypoints.Count);
    }

    [Fact]
    public void BuildLoopWaypoints_AllSitOnTheCircle()
    {
        const double radius = 800;
        var center = _sut.Project(NewYork, radius, bearingDegrees: 30);

        var waypoints = _sut.BuildLoopWaypoints(NewYork, radius, bearingDegrees: 30, waypointCount: 3);

        foreach (var waypoint in waypoints)
            Assert.Equal(radius, _sut.DistanceMeters(center, waypoint), 0.001);
    }

    [Fact]
    public void BuildLoopWaypoints_AreEvenlySpacedIncludingTheStart()
    {
        // 3 waypoints + the start point = 4 points evenly spaced around the circle.
        var waypoints = _sut.BuildLoopWaypoints(NewYork, radiusMeters: 800, bearingDegrees: 0, waypointCount: 3);

        var legs = new[]
        {
            _sut.DistanceMeters(NewYork, waypoints[0]),
            _sut.DistanceMeters(waypoints[0], waypoints[1]),
            _sut.DistanceMeters(waypoints[1], waypoints[2]),
            _sut.DistanceMeters(waypoints[2], NewYork),
        };

        foreach (var leg in legs)
            Assert.Equal(legs[0], leg, 0.5);
    }

    [Fact]
    public void BuildLoopWaypoints_NoWaypointCoincidesWithTheStart()
    {
        var waypoints = _sut.BuildLoopWaypoints(NewYork, radiusMeters: 500, bearingDegrees: 210, waypointCount: 4);

        foreach (var waypoint in waypoints)
            Assert.True(_sut.DistanceMeters(NewYork, waypoint) > 1, "A waypoint landed on the start point.");
    }

    [Fact]
    public void BuildLoopWaypoints_FarthestWaypointIsRoughlyTwiceTheRadius()
    {
        const double radius = 1_000;

        var waypoints = _sut.BuildLoopWaypoints(NewYork, radius, bearingDegrees: 0, waypointCount: 3);

        // With 3 waypoints the middle one is diametrically opposite the start.
        Assert.Equal(2 * radius, _sut.DistanceMeters(NewYork, waypoints[1]), 1.0);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    [InlineData(double.NaN)]
    public void BuildLoopWaypoints_InvalidRadius_Throws(double radius)
        => Assert.Throws<ArgumentOutOfRangeException>(
            () => _sut.BuildLoopWaypoints(NewYork, radius, 0, waypointCount: 3));

    [Theory]
    [InlineData(1)]
    [InlineData(9)]
    public void BuildLoopWaypoints_InvalidCount_Throws(int count)
        => Assert.Throws<ArgumentOutOfRangeException>(
            () => _sut.BuildLoopWaypoints(NewYork, 800, 0, count));
}
