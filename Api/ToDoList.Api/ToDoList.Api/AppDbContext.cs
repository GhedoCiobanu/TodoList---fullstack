using Microsoft.EntityFrameworkCore;
using ToDoList.Api;

namespace TodoList.Api
{
    // Moștenim clasa DbContext oferită de Microsoft pentru a controla baza de date
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Această linie îi spune sistemului să creeze în SQL Server un tabel numit „Todos” care va respecta modelul tău TodoItem
        public DbSet<TodoItem> Todos { get; set; }
    }
}
