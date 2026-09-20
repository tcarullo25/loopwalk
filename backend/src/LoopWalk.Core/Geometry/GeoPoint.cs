namespace LoopWalk.Core.Geometry;

/// <summary>A WGS-84 coordinate. Latitude is north-positive, longitude east-positive.</summary>
public readonly record struct GeoPoint(double Lat, double Lon)
{
    public static GeoPoint Create(double lat, double lon)
    {
        if (double.IsNaN(lat) || lat is < -90 or > 90)
            throw new ArgumentOutOfRangeException(nameof(lat), lat, "Latitude must be between -90 and 90.");
        if (double.IsNaN(lon) || lon is < -180 or > 180)
            throw new ArgumentOutOfRangeException(nameof(lon), lon, "Longitude must be between -180 and 180.");

        return new GeoPoint(lat, lon);
    }

    /// <summary>GeoJSON positions are [longitude, latitude] — the reverse of how we name them.</summary>
    public double[] ToGeoJsonPosition() => [Lon, Lat];
}
