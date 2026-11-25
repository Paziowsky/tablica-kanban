import { PRIORITY_LABELS } from "./labels.js";

export default function Filters({ filters, assignees, onChange }) {
  const set = (field) => (event) => onChange({ ...filters, [field]: event.target.value });

  return (
    <div className="d-flex flex-wrap gap-2">
      <select className="form-select form-select-sm w-auto" aria-label="Filtruj według priorytetu"
        value={filters.priority} onChange={set("priority")} data-testid="filter-priority">
        <option value="">Wszystkie priorytety</option>
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className="form-select form-select-sm w-auto" aria-label="Filtruj według osoby"
        value={filters.assignee} onChange={set("assignee")} data-testid="filter-assignee">
        <option value="">Wszystkie osoby</option>
        {assignees.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  );
}
