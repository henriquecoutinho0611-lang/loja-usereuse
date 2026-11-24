import type { StoreScreen } from "../routes/types";

export function Footer({
  isMerchant,
  whatsappUrl,
  onHome,
  onAccount,
  onNavigate,
  onSupport,
  onAdmin,
  onMerchantSection,
  onLogout,
  onMissingWhatsapp,
}: {
  isMerchant: boolean;
  whatsappUrl: string;
  onHome: () => void;
  onAccount: () => void;
  onNavigate: (screen: StoreScreen) => void;
  onSupport: () => void;
  onAdmin: () => void;
  onMerchantSection: (id: string) => void;
  onLogout: () => void;
  onMissingWhatsapp: () => void;
}) {
  return (
    <>
      <footer className="site-footer">
        <button className="brand footer-brand" onClick={onHome}><span className="brand-mark">c.</span><span>casa<span className="brand-light">&amp;forma</span></span></button>
        <p>{isMerchant ? "Área administrativa da Casa & Forma." : "Móveis industriais para morar com personalidade."}</p>
        {isMerchant ? (
          <div className="footer-links">
            <button onClick={() => onMerchantSection("merchant-products")}>Produtos</button>
            <button onClick={() => onMerchantSection("merchant-sales")}>Pedidos e vendas</button>
            <button onClick={() => onMerchantSection("merchant-settings")}>Configurações</button>
            <button onClick={onLogout}>Sair</button>
          </div>
        ) : (
          <div className="footer-links">
            <button onClick={onAccount}>Minha conta</button>
            <button onClick={() => onNavigate("cart")}>Sacola</button>
            <button onClick={onSupport}>Atendimento</button>
            <button onClick={onAdmin}>Área do lojista</button>
          </div>
        )}
        <div className="footer-bottom"><span>© 2026 Casa &amp; Forma. Todos os direitos reservados.</span><span>Feito para viver bem.</span></div>
      </footer>
      {!isMerchant ? whatsappUrl
        ? <a className="whatsapp-fab" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Fale conosco pelo WhatsApp"><span>◉</span><span>Fale com a gente</span></a>
        : <button className="whatsapp-fab" onClick={onMissingWhatsapp} aria-label="Configurar WhatsApp"><span>◉</span><span>Fale com a gente</span></button>
        : null}
    </>
  );
}
