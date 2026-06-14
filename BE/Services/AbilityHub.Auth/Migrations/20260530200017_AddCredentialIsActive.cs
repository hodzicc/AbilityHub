using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Auth.Migrations
{
    /// <inheritdoc />
    public partial class AddCredentialIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Credentials",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Credentials");
        }
    }
}
