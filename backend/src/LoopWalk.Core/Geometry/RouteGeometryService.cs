namespace LoopWalk.Core.Geometry;

/// <summary>
/// Spherical trigonometry for loop construction. Pure: no I/O, no randomness, no clock.
/// </summary>
public sealed class RouteGeometryService : IRouteGeometryService
{
    /// <summary>Mean Earth radius (IUGG), metres.</summary>
    public const double EarthRadiusMeters = 6_371_008.8;

    public const int MinWaypoints = 2;
    public const int MaxWaypoints = 8;

    public GeoPoint Project(GeoPoint origin, double distanceMeters, double bearingDegrees)
    {
        if (double.IsNaN(distanceMeters) || distanceMeters < 0)
            throw new ArgumentOutOfRangeException(nameof(distanceMeters), distanceMeters, "Distance must be non-negative.");
        if (double.IsNaN(bearingDegrees))
            throw new ArgumentOutOfRangeException(nameof(bearingDegrees), bearingDegrees, "Bearing must be a number.");

        var angular = distanceMeters / EarthRadiusMeters;
        var bearing = double.DegreesToRadians(bearingDegrees);
        var lat1 = double.DegreesToRadians(origin.Lat);
        var lon1 = double.DegreesToRadians(origin.Lon);

        var (sinLat1, cosLat1) = double.SinCos(lat1);
        var (sinAngular, cosAngular) = double.SinCos(angular);
        var (sinBearing, cosBearing) = double.SinCos(bearing);

        var sinLat2 = sinLat1 * cosAngular + cosLat1 * sinAngular * cosBearing;
        var lat2 = double.Asin(double.Clamp(sinLat2, -1.0, 1.0));

        var lon2 = lon1 + double.Atan2(
            sinBearing * sinAngular * cosLat1,
            cosAngular - sinLat1 * sinLat2);

        return new GeoPoint(
            double.RadiansToDegrees(lat2),
            NormalizeLongitude(double.RadiansToDegrees(lon2)));
    }

    public double DistanceMeters(GeoPoint from, GeoPoint to)
    {
        var lat1 = double.DegreesToRadians(from.Lat);
        var lat2 = double.DegreesToRadians(to.Lat);
        var deltaLat = lat2 - lat1;
        var deltaLon = double.DegreesToRadians(to.Lon - from.Lon);

        var sinHalfLat = double.Sin(deltaLat / 2);
        var sinHalfLon = double.Sin(deltaLon / 2);

        var a = sinHalfLat * sinHalfLat
              + double.Cos(lat1) * double.Cos(lat2) * sinHalfLon * sinHalfLon;

        return 2 * EarthRadiusMeters * double.Asin(double.Sqrt(double.Clamp(a, 0.0, 1.0)));
    }

    public IReadOnlyList<GeoPoint> BuildLoopWaypoints(GeoPoint start, double radiusMeters, double bearingDegrees, int waypointCount)
    {
        if (double.IsNaN(radiusMeters) || radiusMeters <= 0)
            throw new ArgumentOutOfRangeException(nameof(radiusMeters), radiusMeters, "Radius must be positive.");
        if (waypointCount is < MinWaypoints or > MaxWaypoints)
            throw new ArgumentOutOfRangeException(nameof(waypointCount), waypointCount,
                $"Waypoint count must be between {MinWaypoints} and {MaxWaypoints}.");

        // The circle is centred one radius away, so the start point sits on its circumference.
        var center = Project(start, radiusMeters, bearingDegrees);

        // Walking outward along `bearing` puts the start at `bearing + 180` as seen from the centre.
        // Spreading the waypoints from there keeps them ordered around the circle away from the start.
        var startBearingFromCenter = bearingDegrees + 180.0;
        var step = 360.0 / (waypointCount + 1);

        var waypoints = new GeoPoint[waypointCount];
        for (var i = 0; i < waypointCount; i++)
        {
            var bearingFromCenter = startBearingFromCenter + step * (i + 1);
            waypoints[i] = Project(center, radiusMeters, bearingFromCenter);
        }

        return waypoints;
    }

    /// <summary>Wraps a longitude into [-180, 180] so projections crossing the antimeridian stay valid.</summary>
    private static double NormalizeLongitude(double degrees)
        => ((degrees + 540.0) % 360.0) - 180.0;
}
