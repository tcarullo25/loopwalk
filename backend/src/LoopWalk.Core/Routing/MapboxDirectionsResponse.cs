using System.Text.Json.Serialization;

namespace LoopWalk.Core.Routing;

/// <summary>Wire format of the Mapbox Directions API response. Internal — never leaves this layer.</summary>
internal sealed class MapboxDirectionsResponse
{
    /// <summary>"Ok", "NoRoute", "NoSegment", "InvalidInput", …</summary>
    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("routes")]
    public List<MapboxRoute>? Routes { get; set; }
}

internal sealed class MapboxRoute
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("geometry")]
    public MapboxGeometry? Geometry { get; set; }
}

internal sealed class MapboxGeometry
{
    /// <summary>GeoJSON positions: [longitude, latitude].</summary>
    [JsonPropertyName("coordinates")]
    public List<double[]>? Coordinates { get; set; }
}
