using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Usage.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityInProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "InProgress",
                table: "ActivityRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InProgress",
                table: "ActivityRecords");
        }
    }
}
