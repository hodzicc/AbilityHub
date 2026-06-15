namespace AbilityHub.AppRegistry.Controllers.DTOs;

public class RegisterApplicationRequest
{
    public required string Key { get; set; }
    public required string Name { get; set; }
    public string Platform { get; set; } = "Mobile";
    public string Version { get; set; } = string.Empty;
    public string DataFormat { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string IconName { get; set; } = "AppWindow";
    public string Color { get; set; } = "#4F46E5";
    public int MinAge { get; set; } = 0;
    public int MaxAge { get; set; } = 18;
    public string FeaturesJson { get; set; } = "[]";
}

public class UpdateApplicationRequest
{
    public required string Name { get; set; }
    public string Platform { get; set; } = "Mobile";
    public string Version { get; set; } = string.Empty;
    public string DataFormat { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Category { get; set; } = string.Empty;
    public string IconName { get; set; } = "AppWindow";
    public string Color { get; set; } = "#4F46E5";
    public int MinAge { get; set; } = 0;
    public int MaxAge { get; set; } = 18;
    public string FeaturesJson { get; set; } = "[]";
}

public class ApplicationResponse
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string DataFormat { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Category { get; set; } = string.Empty;
    public string IconName { get; set; } = "AppWindow";
    public string Color { get; set; } = "#4F46E5";
    public int MinAge { get; set; }
    public int MaxAge { get; set; }
    public string FeaturesJson { get; set; } = "[]";
}

public class AssignAppRequest
{
    public Guid ApplicationId { get; set; }
}

public class ChildApplicationResponse
{
    public Guid ApplicationId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}
