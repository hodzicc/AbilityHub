using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.AppRegistry.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationDisplayFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Applications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Applications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "#4F46E5");

            migrationBuilder.AddColumn<string>(
                name: "FeaturesJson",
                table: "Applications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "IconName",
                table: "Applications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "AppWindow");

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "Applications",
                type: "int",
                nullable: false,
                defaultValue: 18);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Applications",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Category", table: "Applications");
            migrationBuilder.DropColumn(name: "Color", table: "Applications");
            migrationBuilder.DropColumn(name: "FeaturesJson", table: "Applications");
            migrationBuilder.DropColumn(name: "IconName", table: "Applications");
            migrationBuilder.DropColumn(name: "MaxAge", table: "Applications");
            migrationBuilder.DropColumn(name: "MinAge", table: "Applications");
        }
    }
}
