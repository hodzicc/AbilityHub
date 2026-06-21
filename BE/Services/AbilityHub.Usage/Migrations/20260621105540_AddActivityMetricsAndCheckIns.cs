using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Usage.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityMetricsAndCheckIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CompletedViaAction",
                table: "ActivityRecords",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationSeconds",
                table: "ActivityRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ErrorsCount",
                table: "ActivityRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HintsShown",
                table: "ActivityRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "StartedViaAction",
                table: "ActivityRecords",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StepsCompleted",
                table: "ActivityRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StepsTotal",
                table: "ActivityRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WeeklyCheckIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChildId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    MoodBefore = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MoodAfter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HelpLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PerformanceQuality = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SafetyIncident = table.Column<bool>(type: "bit", nullable: false),
                    SafetyIncidentNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DayContext = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DayContextNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UsesSkillOutsideApp = table.Column<bool>(type: "bit", nullable: true),
                    GeneralNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyCheckIns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyCheckIns_ChildId_WeekStartDate",
                table: "WeeklyCheckIns",
                columns: new[] { "ChildId", "WeekStartDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyCheckIns");

            migrationBuilder.DropColumn(
                name: "CompletedViaAction",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "DurationSeconds",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "ErrorsCount",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "HintsShown",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "StartedViaAction",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "StepsCompleted",
                table: "ActivityRecords");

            migrationBuilder.DropColumn(
                name: "StepsTotal",
                table: "ActivityRecords");
        }
    }
}
