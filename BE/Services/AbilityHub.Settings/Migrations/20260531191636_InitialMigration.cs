using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Settings.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppRestrictions",
                columns: table => new
                {
                    ChildId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DailyTimeLimitMinutes = table.Column<int>(type: "int", nullable: true),
                    IsBlocked = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedByGuardianId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRestrictions", x => new { x.ChildId, x.ApplicationId });
                });

            migrationBuilder.CreateTable(
                name: "Preferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChildId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Preferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Preferences_ChildId_ApplicationId_Key",
                table: "Preferences",
                columns: new[] { "ChildId", "ApplicationId", "Key" },
                unique: true,
                filter: "[ApplicationId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppRestrictions");

            migrationBuilder.DropTable(
                name: "Preferences");
        }
    }
}
