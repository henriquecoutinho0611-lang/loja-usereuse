import type { CartLine } from "../cartTypes";

interface CartItemProps {
  line: CartLine;
  imageUrl: (path: string | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  itemKey: (line: CartLine) => string;
  onSelect: (line: CartLine) => void;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export function CartItem({
  line,
  imageUrl,
  money,
  itemKey,
  onSelect,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const key = itemKey(line);
  const selectedOptions = [
    ["Cor do ferro", line.selection.ironColor],
    ["Cor da madeira", line.selection.woodColor],
    ["Tipo da madeira", line.selection.woodType],
    ["Cor do estofado", line.selection.upholsteryColor],
  ] as const;

  return (
    <article className="cart-line">
      <button className="cart-product-image" onClick={() => onSelect(line)}>
        <img src={imageUrl(line.product.image)} alt={line.product.title} />
      </button>
      <div className="cart-line-info">
        <span>{line.product.department}</span>
        <button className="cart-product-title" onClick={() => onSelect(line)}>{line.product.title}</button>
        <strong>{money(line.product.price)}</strong>
        <div className="cart-product-selections">
          {selectedOptions.map(([label, value]) => value ? <span key={label}>{label}: {value}</span> : null)}
        </div>
        <div className="cart-quantity">
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              max="99"
              value={line.quantity}
              onChange={(event) => onQuantityChange(key, Number(event.currentTarget.value))}
            />
          </label>
          <button className="text-link danger-link" onClick={() => onRemove(key)}>Remover</button>
        </div>
      </div>
      <b className="cart-line-total">{money(line.product.price * line.quantity)}</b>
    </article>
  );
}
