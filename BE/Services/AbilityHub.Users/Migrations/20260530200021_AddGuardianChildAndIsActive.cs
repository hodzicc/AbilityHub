using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AbilityHub.Users.Migrations
{
    /// <inheritdoc />
    public partial class AddGuardianChildAndIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "GuardianChildren",
                columns: table => new
                {
                    GuardianId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChildId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LinkedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuardianChildren", x => new { x.GuardianId, x.ChildId });
                    table.ForeignKey(
                        name: "FK_GuardianChildren_Users_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GuardianChildren_Users_GuardianId",
                        column: x => x.GuardianId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GuardianChildren_ChildId",
                table: "GuardianChildren",
                column: "ChildId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GuardianChildren");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");
        }
    }
}
