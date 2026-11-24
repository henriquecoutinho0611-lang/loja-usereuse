import type { AccountProfile } from "../app/models";
import type { StoreScreen, UserRole } from "../routes/types";

interface HeaderProps {
  role: UserRole;
  account: AccountProfile | null;
  mobileMenuOpen: boolean;
  departmentMenuOpen: boolean;
  search: string;
  cartCount: number;
  departments: string[];
  onToggleMobileMenu: () => void;
  onToggleDepartmentMenu: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onDepartmentSelect: (department: string) => void;
  onNavigate: (screen: StoreScreen) => void;
  onHome: () => void;
  onAccount: () => void;
  onLogout: () => void;
  onMerchantSection: (id: string) => void;
}

export function Header({
  role,
  account,
  mobileMenuOpen,
  departmentMenuOpen,
  search,
  cartCount,
  departments,
  onToggleMobileMenu,
  onToggleDepartmentMenu,
  onSearchChange,
  onClearSearch,
  onDepartmentSelect,
  onNavigate,
  onHome,
  onAccount,
  onLogout,
  onMerchantSection,
}: HeaderProps) {
  return (
    <>
      <div className="announcement">
        {role === "merchant"
          ? <><span>PAINEL DO LOJISTA</span> gestão da Casa &amp; Forma</>
          : <><span>MÓVEIS INDUSTRIAIS</span> direto do lojista <span className="announcement-dot">•</span> Consulte prazo e entrega na compra</>}
      </div>
      <header className={`site-header${role === "merchant" ? " merchant-header" : ""}`}>
        {role !== "merchant" ? <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={onToggleMobileMenu}>{mobileMenuOpen ? "×" : "☰"}</button> : null}
        <button className="brand" aria-label="Casa e Forma, início" onClick={onHome}><span className="brand-mark">c.</span><span>casa<span className="brand-light">&amp;forma</span></span></button>
        {role === "merchant" ? (
          <nav className={`main-nav merchant-nav${mobileMenuOpen ? " nav-open" : ""}`}>
            <button onClick={() => onMerchantSection("merchant-products")}>Produtos</button>
            <button onClick={() => onMerchantSection("merchant-sales")}>Pedidos e vendas</button>
            <button onClick={() => onMerchantSection("merchant-settings")}>Configurações</button>
          </nav>
        ) : (
          <nav className={`main-nav${mobileMenuOpen ? " nav-open" : ""}`}>
            <button className="nav-department" onClick={onToggleDepartmentMenu}>Departamentos <span>{departmentMenuOpen ? "⌃" : "⌄"}</span></button>
            <button onClick={() => onDepartmentSelect("Todos os departamentos")}>Novidades</button>
            <button onClick={() => onDepartmentSelect("Todos os departamentos")}>Mais vendidos</button>
          </nav>
        )}
        {role === "merchant" ? (
          <div className="header-actions">
            <span className="connected-pill">{account?.name || "Lojista"}</span>
            <button className="text-link" onClick={onLogout}>Sair</button>
          </div>
        ) : (
          <div className="header-actions">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} placeholder="O que você procura?" aria-label="Buscar produtos" />
              {search ? <button aria-label="Limpar busca" onClick={onClearSearch}>×</button> : null}
            </label>
            <button className="icon-button user-action" aria-label="Minha conta" title="Minha conta" onClick={onAccount}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>
            </button>
            <button className="icon-button bag-action" aria-label="Abrir sacola" title="Sacola" onClick={() => onNavigate("cart")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg>
              {cartCount ? <span className="bag-count">{cartCount}</span> : null}
            </button>
          </div>
        )}
        {role !== "merchant" && departmentMenuOpen ? (
          <div className="department-popover">
            {departments.map((department) => <button key={department} onClick={() => onDepartmentSelect(department)}>{department}<span>↗</span></button>)}
          </div>
        ) : null}
      </header>
    </>
  );
}
