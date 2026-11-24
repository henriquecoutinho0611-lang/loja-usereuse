import type { Banner, Product } from "../../../app/models";
import { ProductFilter } from "../components/ProductFilter";
import { ProductGrid } from "../components/ProductGrid";
import type { ProductFilters } from "../catalogService";

function price(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function PriceLine({ product }: { product: Product }) {
  return (
    <div className="price-line">
      {product.oldPrice ? <span className="old-price">{price(product.oldPrice)}</span> : null}
      <strong>{price(product.price)}</strong>
    </div>
  );
}

export interface CatalogPageProps {
  banners: Banner[];
  bannerIndex: number;
  onBannerChange: (index: number) => void;
  onScrollToCatalog: () => void;
  showroomProducts: Product[];
  activeShowroomIndex: number;
  onShowroomChange: (index: number) => void;
  showroomProduct: Product | null;
  imageUrl: (path: string | null | undefined) => string;
  onSelectProduct: (product: Product) => void;
  search: string;
  departments: string[];
  materials: string[];
  selectedDepartment: string;
  filters: ProductFilters;
  onDepartmentChange: (department: string) => void;
  onFilterChange: (field: keyof ProductFilters, value: string) => void;
  onClearFilters: () => void;
  visibleProducts: Product[];
  productCount: number;
  productLoading: boolean;
  productError: string;
  onRetryCatalog: () => void;
  onWishlist: () => void;
  onSubscribe: () => void;
}

export function CatalogPage({
  banners,
  bannerIndex,
  onBannerChange,
  onScrollToCatalog,
  showroomProducts,
  activeShowroomIndex,
  onShowroomChange,
  showroomProduct,
  imageUrl,
  onSelectProduct,
  search,
  departments,
  materials,
  selectedDepartment,
  filters,
  onDepartmentChange,
  onFilterChange,
  onClearFilters,
  visibleProducts,
  productCount,
  productLoading,
  productError,
  onRetryCatalog,
  onWishlist,
  onSubscribe,
}: CatalogPageProps) {
  const activeBanner = banners[bannerIndex];

  return (
    <>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(29,39,32,.76) 0%, rgba(29,39,32,.33) 43%, rgba(29,39,32,0) 100%), url("${activeBanner?.image || ""}")` }}>
        <div className="hero-content">
          <div className="eyebrow hero-eyebrow"><span className="eyebrow-line"></span>{activeBanner?.eyebrow || "CASA LEVE, VIDA LEVE"}</div>
          <h1>{activeBanner?.title || "Descubra nossa coleção."}</h1>
          <p>{activeBanner?.text}</p>
          <button className="button button-cream" onClick={onScrollToCatalog}>{activeBanner?.cta || "Descobrir a coleção"} <span>→</span></button>
        </div>
        <span className="hero-tag">{activeBanner?.tag || "NOVIDADES"}</span>
        {banners.length > 1 ? (
          <div className="hero-controls">
            <button aria-label="Promoção anterior" onClick={() => onBannerChange((bannerIndex - 1 + banners.length) % banners.length)}>‹</button>
            <span>{String(bannerIndex + 1).padStart(2, "0")} <i></i> {String(banners.length).padStart(2, "0")}</span>
            <button aria-label="Próxima promoção" onClick={() => onBannerChange((bannerIndex + 1) % banners.length)}>›</button>
          </div>
        ) : null}
      </section>

      <div className="benefit-strip">
        <div><span className="benefit-icon">↗</span><span><b>Atendimento em todo o Brasil</b><small>Frete fora de SP sob consulta</small></span></div>
        <div><span className="benefit-icon">✓</span><span><b>Compra segura</b><small>Seus dados protegidos</small></span></div>
        <div><span className="benefit-icon">◎</span><span><b>Feito com cuidado</b><small>Qualidade em cada detalhe</small></span></div>
        <div><span className="benefit-icon">⌂</span><span><b>Design que acolhe</b><small>Peças para viver bem</small></span></div>
      </div>

      {showroomProducts.length ? (
        <section className="ambient-section" id="showroom">
          <div className="ambient-heading">
            <div><div className="eyebrow"><span className="eyebrow-line"></span>MÓVEIS NO SEU AMBIENTE</div><h2>Role e descubra cada detalhe.</h2><p>Enquanto você percorre a página, veja os destaques em diferentes ambientes.</p></div>
            <span className="ambient-count">{String(activeShowroomIndex + 1).padStart(2, "0")} / {String(showroomProducts.length).padStart(2, "0")}</span>
          </div>
          <div className="ambient-layout">
            <aside className="ambient-stage" aria-live="polite">
              {showroomProduct ? (
                <>
                  <div className="ambient-stage-photo"><img src={imageUrl(showroomProduct.ambientImage || showroomProduct.image)} alt={`${showroomProduct.title} em ambiente decorado`} /></div>
                  <div className="ambient-stage-shade"></div>
                  <div className="ambient-stage-content">
                    <span>{showroomProduct.department} · EM DESTAQUE</span><h3>{showroomProduct.title}</h3>
                    <PriceLine product={showroomProduct} />
                    <button className="button button-cream" onClick={() => onSelectProduct(showroomProduct)}>Conhecer produto <span>↗</span></button>
                  </div>
                  <div className="ambient-progress" aria-label="Produtos em destaque">
                    {showroomProducts.map((product, index) => <button key={product.id} className={index === activeShowroomIndex ? "active" : ""} aria-label={`Ver destaque: ${product.title}`} onClick={() => onShowroomChange(index)} />)}
                  </div>
                </>
              ) : null}
            </aside>
            <div className="ambient-steps">
              {showroomProducts.map((product, index) => (
                <article key={product.id} className={`ambient-step${activeShowroomIndex === index ? " is-active" : ""}`} data-showroom-index={index}>
                  <div className="ambient-step-kicker"><span>{String(index + 1).padStart(2, "0")}</span><span>{product.department}</span></div>
                  <h3>{product.title}</h3><p>{product.description}</p>
                  <div className="ambient-step-bottom"><PriceLine product={product} /><button className="text-link" onClick={() => onSelectProduct(product)}>Ver produto <span>→</span></button></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line"></span>ESCOLHAS COM INTENÇÃO</div><h2>{search ? "Resultados da busca" : "Encontre seu próximo favorito"}</h2><p>{search ? `Produtos encontrados para “${search}”` : "Peças especiais para cada cantinho da sua casa."}</p></div>
          <button className="text-link" onClick={onClearFilters}>Ver coleção completa <span>→</span></button>
        </div>
        <ProductFilter
          departments={departments}
          materials={materials}
          selectedDepartment={selectedDepartment}
          filters={filters}
          resultCount={visibleProducts.length}
          onDepartmentChange={onDepartmentChange}
          onFilterChange={onFilterChange}
          onClear={onClearFilters}
        />
        <div className="catalog-tools"><div className="department-chips">{departments.map((department) => <button key={department} className={`chip${selectedDepartment === department ? " active" : ""}`} onClick={() => onDepartmentChange(department)}>{department}</button>)}</div><span className="product-count">{visibleProducts.length} produtos</span></div>
        {productLoading ? <div className="empty-state"><h3>Carregando catálogo...</h3></div>
          : productError ? <div className="empty-state"><span>!</span><h3>Não foi possível abrir o catálogo</h3><p>{productError}</p><button className="button button-dark" onClick={onRetryCatalog}>Tentar novamente</button></div>
            : visibleProducts.length ? <ProductGrid products={visibleProducts} onSelect={onSelectProduct} onWishlist={onWishlist} />
              : <div className="empty-state"><span>⌕</span><h3>{productCount ? "Nenhum produto encontrado" : "Ainda não há produtos publicados"}</h3><p>{productCount ? "Tente outro termo ou escolha um departamento." : "Os produtos serão exibidos aqui assim que o lojista cadastrar os móveis no painel."}</p>{productCount ? <button className="button button-dark" onClick={onClearFilters}>Limpar filtros</button> : null}</div>}
      </section>

      <section className="newsletter">
        <div><div className="eyebrow"><span className="eyebrow-line"></span>UM POUCO DE INSPIRAÇÃO</div><h2>Design industrial<br />para viver bem.</h2><p>Novidades, ideias e condições especiais direto na sua caixa de entrada.</p></div>
        <form onSubmit={(event) => { event.preventDefault(); onSubscribe(); }}>
          <label htmlFor="newsletter-email">Seu melhor e-mail</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="voce@email.com" required /><button aria-label="Assinar novidades">→</button></div><small>Ao se cadastrar, você concorda em receber novidades da loja.</small>
        </form>
      </section>
    </>
  );
}
