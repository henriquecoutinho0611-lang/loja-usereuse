import type { ProductFilters } from "../catalogService";

export function ProductFilter({
  departments,
  materials,
  selectedDepartment,
  filters,
  resultCount,
  onDepartmentChange,
  onFilterChange,
  onClear,
}: {
  departments: string[];
  materials: string[];
  selectedDepartment: string;
  filters: ProductFilters;
  resultCount: number;
  onDepartmentChange: (department: string) => void;
  onFilterChange: (field: keyof ProductFilters, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="catalog-filter-panel" aria-label="Filtros do catálogo">
      <label>
        Categoria
        <select value={selectedDepartment} onChange={(event) => onDepartmentChange(event.currentTarget.value)}>
          {departments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
      </label>
      <label>
        Material
        <select value={filters.material} onChange={(event) => onFilterChange("material", event.currentTarget.value)}>
          <option value="">Todos os materiais</option>
          {materials.map((material) => <option key={material} value={material}>{material}</option>)}
        </select>
      </label>
      <fieldset className="catalog-filter-range">
        <legend>Preço (R$)</legend>
        <label>
          <span>Mínimo</span>
          <input type="number" min="0" step="1" value={filters.minPrice} onChange={(event) => onFilterChange("minPrice", event.currentTarget.value)} placeholder="0" />
        </label>
        <label>
          <span>Máximo</span>
          <input type="number" min="0" step="1" value={filters.maxPrice} onChange={(event) => onFilterChange("maxPrice", event.currentTarget.value)} placeholder="Sem limite" />
        </label>
      </fieldset>
      <fieldset className="catalog-filter-range catalog-dimensions-filter">
        <legend>Dimensões máximas (cm)</legend>
        <label>
          <span>Largura</span>
          <input type="number" min="0" step="1" value={filters.maxWidth} onChange={(event) => onFilterChange("maxWidth", event.currentTarget.value)} placeholder="Qualquer" />
        </label>
        <label>
          <span>Altura</span>
          <input type="number" min="0" step="1" value={filters.maxHeight} onChange={(event) => onFilterChange("maxHeight", event.currentTarget.value)} placeholder="Qualquer" />
        </label>
      </fieldset>
      <div className="catalog-filter-actions">
        <span>{resultCount} {resultCount === 1 ? "produto" : "produtos"}</span>
        <button type="button" className="text-link" onClick={onClear}>Limpar filtros</button>
      </div>
    </div>
  );
}
