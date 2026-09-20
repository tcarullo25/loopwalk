namespace LoopWalk.Core.Geometry;

public interface IRouteGeometryService
{
    /// <summary>
    /// The point reached by travelling <paramref name="distanceMeters"/> from
    /// <paramref name="origin"/> along a great circle at <paramref name="bearingDegrees"/>
    /// (0 = north, clockwise).
    /// </summary>
    GeoPoint Project(GeoPoint origin, double distanceMeters, double bearingDegrees);

    /// <summary>Great-circle distance between two points, in metres.</summary>
    double DistanceMeters(GeoPoint from, GeoPoint to);

    /// <summary>
    /// Waypoints for a loop that starts and ends at <paramref name="start"/>. The loop's circle is
    /// centred <paramref name="radiusMeters"/> away along <paramref name="bearingDegrees"/>, and the
    /// waypoints are spread evenly around that circle. The start point itself is not included.
    /// </summary>
    IReadOnlyList<GeoPoint> BuildLoopWaypoints(GeoPoint start, double radiusMeters, double bearingDegrees, int waypointCount);
}
