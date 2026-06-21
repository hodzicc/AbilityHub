using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Usage.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttributesJson",
                table: "ActivityRecords",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttributesJson",
                table: "ActivityRecords");
        }
    }
}
