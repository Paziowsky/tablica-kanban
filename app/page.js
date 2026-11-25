import Board from "@/components/Board.js";

export default function Home() {
  return (
    <>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">Tablica zadań zespołu</span>
        </div>
      </nav>
      <main className="container-fluid py-3">
        <Board />
      </main>
    </>
  );
}
