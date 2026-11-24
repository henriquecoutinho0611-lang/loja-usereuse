import type { Product, ProductSelection } from "../../../app/models";

const OPTION_FIELDS = [
  { field: "ironColors", selection: "ironColor", label: "Cor do ferro" },
  { field: "woodColors", selection: "woodColor", label: "Cor da madeira" },
  { field: "woodTypes", selection: "woodType", label: "Tipo da madeira" },
  { field: "upholsteryColors", selection: "upholsteryColor", label: "Cor do estofado" },
] as const;

export function ProductSelectionFields({
  product,
  selection,
  onChange,
  heading,
  className = "",
}: {
  product: Product;
  selection: ProductSelection;
  onChange: (field: keyof ProductSelection, value: string | null) => void;
  heading?: string;
  className?: string;
}) {
  const fields = OPTION_FIELDS.filter(({ field }) => product[field].length > 0);
  if (!fields.length) return null;

  return (
    <div className={`product-options ${className}`}>
      {heading ? <strong className="product-options-heading">{heading}</strong> : null}
      {fields.map(({ field, selection: key, label }) => (
        <label key={field}>{label}
          <select value={selection[key] || ""} onChange={(event) => onChange(key, event.currentTarget.value || null)}>
            <option value="">Escolha uma opção</option>
            {product[field].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
