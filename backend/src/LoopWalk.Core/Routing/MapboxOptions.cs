using System.ComponentModel.DataAnnotations;

namespace LoopWalk.Core.Routing;

public sealed class MapboxOptions
{
    public const string SectionName = "Mapbox";

    /// <summary>Secret Mapbox token. Never ships to the browser — the frontend has its own public one.</summary>
    [Required(AllowEmptyStrings = false)]
    public string AccessToken { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.mapbox.com/";

    /// <summary>Directions routing profile. Walking is the only one LoopWalk uses today.</summary>
    public string Profile { get; set; } = "mapbox/walking";

    [Range(1, 60)]
    public int TimeoutSeconds { get; set; } = 15;
}
