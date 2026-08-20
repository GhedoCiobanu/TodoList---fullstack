using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoList.Api;

namespace TodoList.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TodoController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Prin constructor, .NET injectează automat conexiunea la SQL Server în acest controller
        public TodoController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/todo (Citește task-urile direct din tabelul SQL Server)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetAll()
        {
            var todos = await _context.Todos.ToListAsync();
            return Ok(todos);
        }

        // 2. POST: api/todo (Salvează permanent un task nou în SQL Server)
        [HttpPost]
        public async Task<ActionResult<TodoItem>> Create(TodoItem item)
        {
            // Adăugăm obiectul în tabelul din baza de date. 
            // SQL Server se va ocupa SINGUR de generarea ID-ului corect în mod automat!
            _context.Todos.Add(item);
            await _context.SaveChangesAsync(); // Această linie salvează fizic modificările pe hard disk

            return Ok(item);
        }

        // 3. PUT: api/todo/{id} (Actualizează starea unui task în SQL Server)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, TodoItem item)
        {
            // 1. Verificare de siguranță: ID-ul din adresă trebuie să se potrivească cu ID-ul obiectului trimis
            if (id != item.Id) return BadRequest();

            // 2. Căutăm task-ul original existent în baza de date SQL Server
            var todo = await _context.Todos.FindAsync(id);
            if (todo == null) return NotFound();

            // 3. Actualizăm TOATE câmpurile cu noile valori venite de pe Front-end (Cursor)
            todo.Title = item.Title;             // Permite modificarea numelui (pe viitor)
            todo.IsCompleted = item.IsCompleted; // Permite bifarea/debifarea (pentru checkbox-ul de acum)

            // 4. Salvăm modificările permanent pe hard disk în SQL Server
            await _context.SaveChangesAsync();

            return NoContent(); // Întoarcem statusul standard 204 (Succes, fără conținut suplimentar)
        }

        // 4. DELETE: api/todo/{id} (Șterge task-ul definitiv din SQL Server)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Todos.FindAsync(id);
            if (item == null) return NotFound();

            _context.Todos.Remove(item);
            await _context.SaveChangesAsync(); // Șterge fizic rândul din tabel

            return NoContent();
        }
    }
}
