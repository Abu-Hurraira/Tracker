using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMainAccountFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "InitialDeposit",
                table: "Accounts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsMain",
                table: "Accounts",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitialDeposit",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "IsMain",
                table: "Accounts");
        }
    }
}
