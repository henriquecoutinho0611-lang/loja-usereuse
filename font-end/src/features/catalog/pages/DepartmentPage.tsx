import type { Product } from "../../../app/models";
import { ProductFilter } from "../components/ProductFilter";
import { ProductCard } from "../components/ProductCard";
import type { ProductFilters } from "../catalogService";

function price(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function DepartmentPage({
  department,
  departments,
  materials,
  filters,
  products,
  highlightedProduct,
  imageUrl,
  featuredOnly,
  sortOrder,
  onFilterChange,
  onDepartmentChange,
  onClearFilters,
  onFeaturedChange,
  onSortChange,
  onSelectProduct,
  onBack,
}: {
  department: string;
  departments: string[];
  materials: string[];
  filters: ProductFilters;
  products: Product[];
  highlightedProduct: Product | null;
  imageUrl: (path: string | null | undefined) => string;
  featuredOnly: boolean;
  sortOrder: string;
  onFilterChange: (field: keyof ProductFilters, value: string) => void;
  onDepartmentChange: (department: string) => void;
  onClearFilters: () => void;
  onFeaturedChange: () => void;
  onSortChange: (sort: string) => void;
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}) {
  return (
    <section className="department-page">
      <button className="back-link" onClick={onBack}>← Voltar para a loja</button>
      <div className="department-heading"><div className="eyebrow"><span className="eyebrow-line"></span>COLEÇÃO CASA &amp; FORMA</div><h1>{department}</h1><p>Peças industriais escolhidas para trazer presença e funcionalidade ao seu espaço.</p></div>
      {highlightedProduct ? (
        <article className="department-highlight">
          <img src={imageUrl(highlightedProduct.image)} alt={highlightedProduct.title} />
          <div className="department-highlight-copy">
            <div className="eyebrow"><span className="eyebrow-line"></span>DESTAQUE DO DEPARTAMENTO</div>
            <h2>{highlightedProduct.title}</h2><p>{highlightedProduct.description}</p>
            <strong>{price(highlightedProduct.price)}</strong>
            <button className="button button-dark" onClick={() => onSelectProduct(highlightedProduct)}>Conhecer produto →</button>
          </div>
        </article>
      ) : null}
      <ProductFilter
        departments={departments}
        materials={materials}
        selectedDepartment={department}
        filters={filters}
        resultCount={products.length}
        onDepartmentChange={onDepartmentChange}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
      />
      <div className="department-toolbar">
        <div><h2>Todos os produtos</h2><span>{products.length} itens</span></div>
        <div className="department-filters">
          <button className={`chip${featuredOnly ? " active" : ""}`} onClick={onFeaturedChange}>✧ Em destaque</button>
          <label className="sort-select">Ordenar por
            <select value={sortOrder} onChange={(event) => onSortChange(event.currentTarget.value)}>
              <option value="featured">Destaques primeiro</option><option value="price-desc">Maior preço</option><option value="price-asc">Menor preço</option><option value="name">Nome</option>
            </select>
          </label>
        </div>
      </div>
      {products.length
        ? <div className="department-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />)}</div>
        : <div className="empty-state"><h3>Não há produtos neste departamento</h3><p>Quando o lojista publicar itens nessa coleção, eles aparecerão aqui.</p></div>}
    </section>
  );
}
