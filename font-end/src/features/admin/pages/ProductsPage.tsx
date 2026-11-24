import type { ChangeEvent, FormEvent } from "react";
import type { Product, ProductRequest } from "../../../app/models";
import type { ProductNumericDrafts, ProductOptionDrafts } from "../adminTypes";

interface ProductsPageProps {
  products: Product[];
  form: ProductRequest;
  numericDrafts: ProductNumericDrafts;
  optionDrafts: ProductOptionDrafts;
  editingProduct: Product | null;
  mainImagePreview: string;
  ambientImagePreview: string;
  busy: boolean;
  imageUrl: (path: string | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onProductFieldChange: <K extends keyof ProductRequest>(field: K, value: ProductRequest[K]) => void;
  onNumericDraftChange: (field: keyof ProductNumericDrafts, value: string) => void;
  onOptionDraftChange: (field: keyof ProductOptionDrafts, value: string) => void;
  onChooseImage: (event: ChangeEvent<HTMLInputElement>, type: "main" | "ambient") => void;
  onBeginEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductsPage({
  products,
  form,
  numericDrafts,
  optionDrafts,
  editingProduct,
  mainImagePreview,
  ambientImagePreview,
  busy,
  imageUrl,
  money,
  onSubmit,
  onCancelEdit,
  onProductFieldChange,
  onNumericDraftChange,
  onOptionDraftChange,
  onChooseImage,
  onBeginEdit,
  onDelete,
}: ProductsPageProps) {
  return (
    <>
      <form id="merchant-products" className="form-card product-admin-form" onSubmit={onSubmit}>
        <div className="admin-form-heading">
          <h2>{editingProduct ? "Editar produto" : "Adicionar produto"}</h2>
          {editingProduct ? <button type="button" className="text-link" onClick={onCancelEdit}>Cancelar edição</button> : null}
        </div>
        <div className="form-grid">
          <label className="full-field">Título do produto<input value={form.title} onChange={(event) => onProductFieldChange("title", event.currentTarget.value)} required maxLength={140} placeholder="Ex.: Estante Linha Bruta" /></label>
          <label className="full-field">Descrição<textarea value={form.description} onChange={(event) => onProductFieldChange("description", event.currentTarget.value)} required maxLength={8000} rows={4} placeholder="Materiais, cuidados e características do móvel." /></label>
          <label>Departamento<input value={form.department} onChange={(event) => onProductFieldChange("department", event.currentTarget.value)} required maxLength={80} placeholder="Ex.: Estantes" /></label>
          <label>Preço atual (R$)<input value={numericDrafts.price} onChange={(event) => onNumericDraftChange("price", event.currentTarget.value)} type="number" min="0.01" step="0.01" required /></label>
          <label>Preço anterior (R$)<input value={numericDrafts.oldPrice} onChange={(event) => onNumericDraftChange("oldPrice", event.currentTarget.value)} type="number" min="0" step="0.01" placeholder="Opcional" /></label>
          <label>Largura (cm)<input value={numericDrafts.width} onChange={(event) => onNumericDraftChange("width", event.currentTarget.value)} type="number" min="0.01" step="0.1" required /></label>
          <label>Altura (cm)<input value={numericDrafts.height} onChange={(event) => onNumericDraftChange("height", event.currentTarget.value)} type="number" min="0.01" step="0.1" required /></label>
          <label>Opções de cor do ferro<textarea value={optionDrafts.ironColors} onChange={(event) => onOptionDraftChange("ironColors", event.currentTarget.value)} rows={2} placeholder="Preto, branco, dourado (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
          <label>Opções de cor da madeira<textarea value={optionDrafts.woodColors} onChange={(event) => onOptionDraftChange("woodColors", event.currentTarget.value)} rows={2} placeholder="Natural, nogueira (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
          <label>Tipos de madeira<textarea value={optionDrafts.woodTypes} onChange={(event) => onOptionDraftChange("woodTypes", event.currentTarget.value)} rows={2} placeholder="Pinus, eucalipto (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
          <label>Opções de cor do estofado<textarea value={optionDrafts.upholsteryColors} onChange={(event) => onOptionDraftChange("upholsteryColors", event.currentTarget.value)} rows={2} placeholder="Cinza, bege (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
          <label className="full-field image-upload-field">
            Imagem principal do produto
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => onChooseImage(event, "main")} required={!editingProduct} />
            <small>JPG, PNG, WEBP ou GIF; até 10 MB.</small>
            {mainImagePreview ? <img className="upload-preview" src={mainImagePreview} alt="Prévia da imagem principal" /> : null}
          </label>
          <label className="full-field image-upload-field">
            Imagem do móvel no ambiente (opcional)
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => onChooseImage(event, "ambient")} />
            <small>Se não escolher outra, será usada a imagem principal.</small>
            {ambientImagePreview ? <img className="upload-preview" src={ambientImagePreview} alt="Prévia da imagem no ambiente" /> : null}
          </label>
          <label className="featured-toggle full-field">
            <input checked={form.featured} onChange={(event) => onProductFieldChange("featured", event.currentTarget.checked)} type="checkbox" />
            <span><strong>Destacar este produto</strong><small>Exibe no showroom dinâmico e no filtro de destaques.</small></span>
          </label>
        </div>
        <div className="admin-form-bottom">
          <span>Os campos e as imagens serão atualizados na loja.</span>
          <button className="button button-dark" disabled={busy}>
            {busy ? "Enviando..." : editingProduct ? "Salvar alterações" : "Publicar produto"} ✓
          </button>
        </div>
      </form>
      <section className="admin-products-panel">
        <div className="admin-products-heading"><h2>Produtos publicados</h2><span>{products.length} itens</span></div>
        {busy && !products.length ? <p className="account-empty">Carregando...</p> : products.length ? (
          <div className="admin-products-list">
            {products.map((product) => (
              <article key={product.id} className="admin-product-row">
                <img src={imageUrl(product.image)} alt={product.title} />
                <div className="admin-product-copy"><span>{product.department}</span><strong>{product.title}</strong><small>{product.width} × {product.height} cm</small></div>
                <div className="admin-product-price"><strong>{money(product.price)}</strong></div>
                <div className="admin-product-actions">
                  <button className="text-link" onClick={() => onBeginEdit(product)}>Editar</button>
                  <button className="text-link danger-link" onClick={() => onDelete(product)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="account-empty">Ainda não há produtos cadastrados. Use o formulário para publicar o primeiro.</p>}
      </section>
    </>
  );
}
