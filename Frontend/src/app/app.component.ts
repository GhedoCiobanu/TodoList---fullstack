import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Încarcă motorul de rețea nativ din Angular

import { TodoItem } from './todo-item'; // Aduce definiția de structură a unui task (Id, Title etc.)

@Component({
  selector: 'app-root', // Eticheta HTML folosită în index.html pentru a încărca această pagină
  templateUrl: './app.component.html', // Calea către fișierul vizual (interfața grafică)
  styleUrls: ['./app.component.css'], // Calea către fișierul de design (stilurile CSS)
})
export class AppComponent implements OnInit {
  // Adresa exactă de internet unde ascultă serverul tău de .NET (luată din pagina ta Swagger)
  private readonly apiUrl = 'https://localhost:7191/api/todo';

  todos: TodoItem[] = []; // Matricea (baza de date locală din pagină) unde ținem task-urile afișate pe ecran
  newTodoTitle = ''; // Variabila care stochează textul pe care îl tastezi în căsuța din formular

  // Ținem evidența ID-ului care este editat în acest moment pe ecran
  editingTodoId: number | null = null;

  //  Stocăm filtrul curent. Valorile posibile sunt: 'toate', 'nefinalizate', 'finalizate'
  currentFilter: 'toate' | 'nefinalizate' | 'finalizate' = 'toate';

  //  Un Getter inteligent care întoarce doar task-urile care se potrivesc cu filtrul selectat
  get filteredTodos(): TodoItem[] {
    if (this.currentFilter === 'nefinalizate') {
      return this.todos.filter((todo) => !todo.IsCompleted);
    }
    if (this.currentFilter === 'finalizate') {
      return this.todos.filter((todo) => todo.IsCompleted);
    }
    return this.todos; // Pentru 'toate', returnăm întreaga listă originală
  }

  // Constructorul injectează pachetul HttpClient și îl redenumește în „this.http” pentru a-l folosi mai jos
  constructor(private http: HttpClient) {}

  // Această metodă se execută automat în fundal o singură dată, fix când se deschide site-ul în browser
  ngOnInit(): void {
    this.getAll(); // Sună instant la server ca să aducă task-urile existente
  }

  // 1. FUNCȚIA DE AFIȘARE (Aduce task-urile din backend)
  getAll(): void {
    // Trimite o cerere web de tip GET către adresa de .NET și așteaptă răspunsul (subscribe)
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (items) =>
        // Mapare inteligentă: .NET trimite litere mici (id, title), dar codul tău cere litere mari (Id, Title)
        (this.todos = items.map((item) => ({
          Id: item.id,
          Title: item.title,
          IsCompleted: item.isCompleted,
        }))),
      error: (err) => console.error('Failed to load todos', err), // Afișează o eroare în consolă dacă pică serverul
    });
  }

  // 2. FUNCȚIA DE ADĂUGARE (Trimite un task nou către server)
  create(): void {
    const title = this.newTodoTitle.trim(); // Curăță textul din căsuță de spații goale inutile de la început/sfârșit
    if (!title) {
      return; // Dacă utilizatorul a apăsat pe buton fără să scrie nimic, oprește funcția aici și nu face nimic
    }

    // Creează obiectul nou cu setările inițiale (Id este 0 pentru că serverul îi va da numărul corect)
    const item: TodoItem = {
      Id: 0,
      Title: title,
      IsCompleted: false,
    };

    // Trimite textul nou prin POST către backend și trimite și obiectul „item” atașat în scrisoare
    this.http.post<any>(this.apiUrl, item).subscribe({
      next: (created) => {
        // Când backend-ul zice „Succes”, adaugă noul task returnat direct în lista noastră de pe ecran
        this.todos.push({
          Id: created.id,
          Title: created.title,
          IsCompleted: created.isCompleted,
        });
        this.newTodoTitle = ''; // Șterge textul din căsuța formularului ca să fie goală pentru următorul task
      },
      error: (err) => console.error('Failed to create todo', err),
    });
  }

  // 3. FUNCȚIA UNIVERSALĂ DE UPDATE (Folosită atât pentru checkbox, cât și pentru editare titlu)
  updateTodo(todo: TodoItem): void {
    // Trimitem întregul obiect modificat prin rețea folosind ruta PUT
    this.http.put(`${this.apiUrl}/${todo.Id}`, todo).subscribe({
      next: () => {
        console.log(`Task ${todo.Id} updated successfully`);
        this.editingTodoId = null; // Ieșim din modul de editare vizuală după succes
      },
      error: (err) => {
        console.error('Failed to update todo', err);
        this.getAll(); // Dacă rețeaua pică, reîncărcăm datele din SQL Server pentru a anula modificările false de pe ecran
      },
    });
  }

  // Activează căsuța de editare text pentru un anumit rând
  startEdit(todo: TodoItem): void {
    this.editingTodoId = todo.Id;
  }

  // 4. FUNCȚIA DE ȘTERGERE (Elimină un task definitiv)
  delete(id: number): void {
    // Trimite o cerere de tip DELETE adăugând numărul ID direct la finalul adresei (ex: api/todo/1)
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        // Când serverul a șters task-ul din memoria lui, curățăm și ecranul local
        // Păstrează în matrice doar task-urile care au un ID diferit de cel pe care tocmai l-am șters
        this.todos = this.todos.filter((todo) => todo.Id !== id);
      },
      error: (err) => console.error('Failed to delete todo', err),
    });
  }
}
