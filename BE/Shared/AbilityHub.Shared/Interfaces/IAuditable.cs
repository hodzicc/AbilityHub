namespace AbilityHub.Shared.Interfaces
{
    public interface IAuditable
    {
        public Guid CreateUserId { get; set; }

        public DateTime CreatedAt { get; set; }
        public Guid? UpdateUserId { get; set; }
        public DateTime? UpdatedAt { get; set;}

    }
}
