// Placeholder page – replaced by the Kanban board in Phase 3.
export default function Home() {
  return (
    <>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">Tablica zadań zespołu</span>
        </div>
      </nav>
      <main className="container py-5">
        <div className="alert alert-success" role="alert">
          Next.js + Bootstrap 5 działa.
        </div>
        <button type="button" className="btn btn-primary">
          Nowe zadanie
        </button>
      </main>
    </>
  );
}
